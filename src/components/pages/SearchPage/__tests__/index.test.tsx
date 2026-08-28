import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SearchResponse } from '@basetube/api';
import { searchApi } from '../../../../api/search';
import SearchPage from '../index';

jest.mock('../../../../api/search', () => ({
  searchApi: { search: jest.fn(), suggest: jest.fn() },
}));
jest.mock('../../../common/Header', () => () => <div data-testid="header" />);
jest.mock('../../../common/Sidebar', () => () => <div data-testid="sidebar" />);

const search = searchApi.search as jest.MockedFunction<typeof searchApi.search>;
const suggest = searchApi.suggest as jest.MockedFunction<typeof searchApi.suggest>;

const response = (overrides: Partial<SearchResponse> = {}): SearchResponse => ({
  success: true,
  data: [
    {
      id: 1078,
      title: 'Marrakech en 4K',
      description: 'Marrakech filmée en 4K',
      thumbnail_url: 'https://cdn.example/poster.jpg',
      duration: 17,
      views_count: 1200,
      channel: { id: 66, name: 'tyest', handle: 'tyest.base' },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasMore: false,
  facets: { categories: { Gaming: 9, 'Travel and events': 2 }, channel_id: { '66': 1 } },
  engine: 'meilisearch',
  highlights: { '1078': { title: '<mark>Marra</mark>kech en 4K' } },
  processingTimeMs: 12,
  ...overrides,
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderPage(entry = '/search?query=marrakech') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/search"
            element={
              <>
                <SearchPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const url = () => screen.getByTestId('location').textContent ?? '';

describe('SearchPage', () => {
  beforeEach(() => {
    search.mockReset();
    suggest.mockReset();
    search.mockResolvedValue(response());
    suggest.mockResolvedValue({ success: true, data: { titles: [], channels: [] } });
  });

  it('reads the query from the URL and asks the API for it', async () => {
    renderPage();
    await waitFor(() => expect(search).toHaveBeenCalled());
    expect(search.mock.calls[0][0]).toMatchObject({ query: 'marrakech', page: 1, sort: 'relevance' });
    expect(await screen.findByText(/Results for/)).toHaveTextContent('Results for “marrakech”');
  });

  it('renders the highlighted title as marked text, not as markup', async () => {
    renderPage();
    const marked = await screen.findByText('Marra');
    expect(marked.tagName).toBe('MARK');
  });

  it('shows the result count and how long the search took', async () => {
    renderPage();
    expect(await screen.findByText(/1 result · 12 ms/)).toBeInTheDocument();
  });

  it('says nothing about the engine when Meilisearch answered', async () => {
    renderPage();
    await screen.findByText(/1 result/);
    expect(screen.queryByText(/search degraded/)).not.toBeInTheDocument();
  });

  it('warns that search is degraded when the MySQL fallback answered', async () => {
    search.mockResolvedValue(response({ engine: 'mysql', facets: null }));
    renderPage();
    expect(await screen.findByText(/search degraded/)).toBeInTheDocument();
  });

  it('offers only the categories present in the facets, with counts', async () => {
    renderPage();
    expect(await screen.findByLabelText(/Gaming/)).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Education/)).not.toBeInTheDocument();
  });

  it('puts a picked category in the URL and in the next request', async () => {
    renderPage();
    fireEvent.click(await screen.findByLabelText(/Gaming/));

    expect(url()).toBe('?query=marrakech&category=Gaming');
    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: 'marrakech', categories: ['Gaming'] }),
        expect.anything()
      )
    );
  });

  it('puts the duration bucket in the URL as min and max seconds on the request', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: '4 to 20 minutes' }));

    expect(url()).toBe('?query=marrakech&duration=medium');
    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ minDuration: 240, maxDuration: 1200 }),
        expect.anything()
      )
    );
  });

  it('puts the sort in the URL, and leaves the default out of it', async () => {
    renderPage();
    const sort = await screen.findByLabelText('Sort');

    fireEvent.change(sort, { target: { value: 'newest' } });
    expect(url()).toBe('?query=marrakech&sort=newest');

    fireEvent.change(await screen.findByLabelText('Sort'), { target: { value: 'relevance' } });
    expect(url()).toBe('?query=marrakech');
  });

  it('clears the filters but keeps the query', async () => {
    renderPage('/search?query=marrakech&category=Gaming&duration=short');
    fireEvent.click(await screen.findByRole('button', { name: 'Clear filters' }));
    expect(url()).toBe('?query=marrakech');
  });

  it('searches a hashtag query as written', async () => {
    renderPage('/search?query=%23marrakech');
    await waitFor(() => expect(search).toHaveBeenCalled());
    expect(search.mock.calls[0][0]).toMatchObject({ query: '#marrakech' });
    expect(await screen.findByText(/Results for/)).toHaveTextContent('Results for “#marrakech”');
  });

  it('offers the top suggestion when a query found nothing', async () => {
    search.mockResolvedValue(response({ data: [], total: 0, highlights: {}, hasMore: false }));
    suggest.mockResolvedValue({
      success: true,
      data: { titles: ['Marrakech en 4K'], channels: [] },
    });

    renderPage('/search?query=marakech');
    expect(await screen.findByText(/Nothing matched/)).toBeInTheDocument();

    const didYouMean = await screen.findByRole('button', { name: 'Marrakech en 4K' });
    fireEvent.click(didYouMean);
    expect(url()).toBe('?query=Marrakech+en+4K');
  });

  it('loads the next page when there is more, and appends it', async () => {
    search.mockResolvedValueOnce(response({ hasMore: true }));
    search.mockResolvedValueOnce(
      response({
        data: [
          {
            id: 2000,
            title: 'Second page hit',
            thumbnail_url: '',
            duration: 60,
            views_count: 3,
          },
        ],
        hasMore: false,
        highlights: {},
      })
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Second page hit')).toBeInTheDocument();
    expect(screen.getByText('Marra')).toBeInTheDocument();
    expect(search.mock.calls[1][0]).toMatchObject({ page: 2 });
  });
});
