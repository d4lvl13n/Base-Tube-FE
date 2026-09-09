import { act, renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/clerk-react';
import api from '../../api/index';
import creditsApi from '../../api/credits';
import { useAuth } from '../../contexts/AuthContext';
import { usePublicThumbnailGenerator } from '../usePublicThumbnailGenerator';

jest.mock('@clerk/clerk-react', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/index', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../api/credits', () => ({
  __esModule: true,
  default: {
    getCreditBalance: jest.fn(),
    getCreditLedger: jest.fn(),
  },
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApiPost = api.post as jest.Mock;
const mockGetCreditBalance = creditsApi.getCreditBalance as jest.Mock;

const createJsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);

const quotaResponse = {
  success: true,
  data: {
    used: 0,
    limit: 10,
    remaining: 10,
    isAnonymous: false,
    tier: 'free',
    resetsAt: '2026-04-14T00:00:00.000Z',
  },
};

const creditResponse = {
  success: true,
  data: {
    mode: 'credits',
    creditInfo: {
      balance: 40,
      reserved: 5,
      available: 35,
    },
    pricing: {
      thumbnail: {
        generatePerImage: 4,
        editPerImage: 6,
        variationPerImage: 3,
      },
      ctr: {
        audit: 2,
        auditWithPersonas: 5,
        generatePerConcept: 8,
      },
    },
  },
};

describe('usePublicThumbnailGenerator', () => {
  let fetchMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    mockUseUser.mockReturnValue({
      isSignedIn: false,
    } as ReturnType<typeof useUser>);

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    } as ReturnType<typeof useAuth>);

    localStorage.clear();
    mockGetCreditBalance.mockResolvedValue({
      creditInfo: creditResponse.data.creditInfo,
      pricing: creditResponse.data.pricing,
    });
    window.Clerk = {
      session: {
        getToken: jest.fn().mockResolvedValue('clerk-token'),
      },
    };

    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: jest.fn(() => 'blob:thumbnail'),
      });
    }

    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: jest.fn(),
      });
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('routes web3-authenticated users through the authenticated CTR endpoint without incrementing landing-page quota', async () => {
    localStorage.setItem('auth_method', 'web3');

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/images/quota')) {
        return Promise.resolve(createJsonResponse(creditResponse));
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    mockApiPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          concepts: [
            {
              id: 'concept-1',
              prompt: 'Web3-safe prompt',
              thumbnailUrl: 'https://example.com/web3-thumb.jpg',
            },
          ],
          detectedNiche: 'technology',
          generationTime: 1200,
          creditInfo: {
            balance: 32,
            reserved: 5,
            available: 27,
          },
          pricing: creditResponse.data.pricing,
        },
      },
    });

    const { result } = renderHook(() => usePublicThumbnailGenerator());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/images/quota'),
        expect.any(Object)
      );
    });

    await act(async () => {
      await result.current.generateThumbnail('Web3 thumbnail prompt');
    });

    await waitFor(() => {
      expect(result.current.thumbnails).toHaveLength(1);
    });

    expect(result.current.usageMode).toBe('credits');
    expect(result.current.creditInfo?.available).toBe(27);

    expect(mockApiPost).toHaveBeenCalledWith('/api/v1/ctr/generate', {
      title: 'Web3 thumbnail prompt',
      prompt: 'Web3 thumbnail prompt',
      style: undefined,
      includeFace: false,
      concepts: 3,
      quality: 'high',
      size: 'landscape',
      model: 'gpt-image-2.5-flare',
      background: undefined,
      outputFormat: undefined,
      outputCompression: undefined,
    }, { timeout: 300000 });

    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/v1/images/generate'))
    ).toBe(false);
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/v1/images/quota/increment'))
    ).toBe(false);
  });

  it.each([false, true])('forwards GPT Image 2.5 options for authenticated=%s', async authenticated => {
    mockUseAuth.mockReturnValue({ isAuthenticated: authenticated } as ReturnType<typeof useAuth>);
    if (authenticated) localStorage.setItem('auth_method', 'web3');
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/images/quota')) return Promise.resolve(createJsonResponse(authenticated ? creditResponse : quotaResponse));
      if (url.includes('/v1/images/generate')) return Promise.resolve(createJsonResponse({ success: true, data: { thumbnailUrl: 'https://example.com/new.webp' } }));
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    mockApiPost.mockResolvedValue({ data: { success: true, data: { concepts: [{ thumbnailUrl: 'https://example.com/new.webp' }], ...creditResponse.data } } });
    const { result } = renderHook(() => usePublicThumbnailGenerator());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const options = { savedStyleId: authenticated ? 7 : undefined, creatorBrief: authenticated ? { title: 'Camera' } : undefined, model: 'gpt-image-2.5-sunburst' as const, quality: 'xhigh' as const, size: '2048x1152' as const, background: 'transparent' as const, outputFormat: 'webp' as const, outputCompression: 0, n: 1 };
    await act(async () => { await result.current.generateThumbnail('A red camera', options); });
    const body = authenticated
      ? mockApiPost.mock.calls.find(([url]) => url === '/api/v1/ctr/generate')?.[1]
      : JSON.parse(fetchMock.mock.calls.find(([url]) => String(url).includes('/v1/images/generate'))?.[1].body);
    if (authenticated) expect(body).toMatchObject({ savedStyleId: 7, creatorBrief: { title: 'Camera' } });
    expect(body).toMatchObject({ model: options.model, quality: options.quality, size: options.size, background: options.background, outputFormat: options.outputFormat, outputCompression: 0 });
  });

  it('sends a real subject through authenticated CTR generation with three concepts', async () => {
    mockUseUser.mockReturnValue({ isSignedIn: true } as ReturnType<typeof useUser>);
    fetchMock.mockResolvedValue(createJsonResponse(creditResponse));
    mockApiPost.mockResolvedValue({ data: { success: true, data: { concepts: [{ id: 'subject-1', thumbnailUrl: 'https://example.com/subject.png', conceptName: 'Subject spotlight', conceptDescription: 'Close-up' }] } } });
    const { result } = renderHook(() => usePublicThumbnailGenerator());
    await waitFor(() => expect(result.current.usageMode).toBe('credits'));
    const file = new File(['image'], 'subject.png', { type: 'image/png' });
    await act(async () => { await result.current.generateThumbnail('My camera', { referenceImage: file, size: 'short', savedStyleId: 7, creatorBrief: { title: 'Camera' } }); });
    expect(mockApiPost.mock.calls[0][0]).toBe('/api/v1/ctr/generate');
    const form = mockApiPost.mock.calls[0][1] as FormData;
    expect(form.get('subjectReference')).toBe(file);
    expect(form.get('savedStyleId')).toBe('7');
    expect(form.get('concepts')).toBe('3');
    expect(result.current.thumbnails[0]).toMatchObject({ conceptName: 'Subject spotlight', conceptDescription: 'Close-up', size: 'short' });
  });

  it('checks the actual CTR credit price before submitting subject concepts', async () => {
    mockUseUser.mockReturnValue({ isSignedIn: true } as ReturnType<typeof useUser>);
    fetchMock.mockResolvedValue(createJsonResponse({ ...creditResponse, data: { ...creditResponse.data, creditInfo: { balance: 20, reserved: 0, available: 20 } } }));
    const { result } = renderHook(() => usePublicThumbnailGenerator());
    await waitFor(() => expect(result.current.creditInfo?.available).toBe(20));
    await act(async () => { await result.current.generateThumbnail('My camera', { referenceImage: new File(['image'], 'subject.png', { type: 'image/png' }) }); });
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(result.current.insufficientCredits).toBe(true);
  });

  it('sets an insufficient credits state on authenticated 402 responses', async () => {
    localStorage.setItem('auth_method', 'web3');

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/images/quota')) {
        return Promise.resolve(createJsonResponse(creditResponse));
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    mockApiPost.mockRejectedValue({
      message: 'Payment required',
      response: {
        status: 402,
        data: {
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'Not enough credits.',
          },
        },
      },
    });

    const { result } = renderHook(() => usePublicThumbnailGenerator());

    await act(async () => {
      await result.current.generateThumbnail('Need credits');
    });

    await waitFor(() => {
      expect(result.current.insufficientCredits).toBe(true);
      expect(result.current.error).toBe('Not enough credits.');
    });
  });

  it('downloads generated thumbnails from the asset URL when there is no persisted thumbnail id', async () => {
    localStorage.setItem('auth_method', 'web3');

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const createObjectUrlSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:thumbnail');
    const revokeObjectUrlSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/v1/images/quota')) {
        return Promise.resolve(createJsonResponse(creditResponse));
      }

      if (url === 'https://example.com/generated-thumb.png') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: jest.fn().mockReturnValue('image/png'),
          },
          blob: jest.fn().mockResolvedValue(new Blob(['thumb'], { type: 'image/png' })),
        } as unknown as Response);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const linkClick = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement(tagName) as HTMLAnchorElement;
        jest.spyOn(anchor, 'click').mockImplementation(linkClick);
        return anchor;
      }

      return originalCreateElement(tagName);
    });

    const { result } = renderHook(() => usePublicThumbnailGenerator());

    await act(async () => {
      await result.current.downloadThumbnail('concept-1', 'https://example.com/generated-thumb.png');
    });

    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/api/v1/thumbnails/concept-1/download'))
    ).toBe(false);
    expect(linkClick).toHaveBeenCalled();

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('keeps loading true while an async generation job is still polling', async () => {
    jest.useFakeTimers();
    localStorage.removeItem('auth_method');
    let jobStatusChecks = 0;

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/v1/images/quota')) {
        return Promise.resolve(createJsonResponse({
          ...quotaResponse,
          data: {
            ...quotaResponse.data,
            isAnonymous: true,
            tier: 'anonymous',
            limit: 1,
            remaining: 1,
          },
        }));
      }

      if (url.includes('/v1/images/generate')) {
        return Promise.resolve(createJsonResponse({
          success: true,
          jobId: 'job-123',
        }, 202));
      }

      if (url.includes('/v1/images/job/job-123')) {
        jobStatusChecks += 1;
        return Promise.resolve(createJsonResponse({
          success: true,
          data: {
            status: jobStatusChecks === 1 ? 'processing' : 'completed',
            result: jobStatusChecks === 1 ? undefined : {
              id: 'thumb-123',
              prompt: 'Async prompt',
              thumbnailUrl: 'https://example.com/async-thumb.jpg',
            },
          },
        }));
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const { result } = renderHook(() => usePublicThumbnailGenerator());

    await act(async () => {
      await result.current.generateThumbnail('Async prompt');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.thumbnails).toHaveLength(1);
    });
  });

  it('clears scheduled polling when the hook unmounts', async () => {
    jest.useFakeTimers();
    localStorage.removeItem('auth_method');

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/v1/images/quota')) {
        return Promise.resolve(createJsonResponse({
          ...quotaResponse,
          data: {
            ...quotaResponse.data,
            isAnonymous: true,
            tier: 'anonymous',
            limit: 1,
            remaining: 1,
          },
        }));
      }

      if (url.includes('/v1/images/generate')) {
        return Promise.resolve(createJsonResponse({
          success: true,
          jobId: 'job-456',
        }, 202));
      }

      if (url.includes('/v1/images/job/job-456')) {
        return Promise.resolve(createJsonResponse({
          success: true,
          data: {
            status: 'completed',
            result: {
              id: 'thumb-456',
              prompt: 'Should never resolve after unmount',
              thumbnailUrl: 'https://example.com/async-thumb-2.jpg',
            },
          },
        }));
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const { result, unmount } = renderHook(() => usePublicThumbnailGenerator());

    await act(async () => {
      await result.current.generateThumbnail('Unmounted async prompt');
    });

    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchMock.mock.calls).toHaveLength(callsBeforeUnmount);
  });
});
