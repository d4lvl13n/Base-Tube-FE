import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { useComments } from '../useComments';
import CommentInput from '../../components/common/Video/Comments/CommentInput';

let mockClerkUser: { id: string; username: string; imageUrl: string } | null = null;
jest.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: Boolean(mockClerkUser) }),
  useUser: () => ({ isLoaded: true, user: mockClerkUser }),
}));
// A public video has no wallet provider. Consumers must use the shared session.
jest.mock('../useWeb3Auth', () => ({ useWeb3Auth: () => { throw new Error('Unexpected standalone wallet session'); } }));
jest.mock('../../api/comment', () => ({ getVideoComments: jest.fn().mockResolvedValue({ comments: [], currentPage: 1, totalPages: 1, totalComments: 0 }) }));
jest.mock('@emoji-mart/react', () => () => null);

function Comments() {
  const comments = useComments({ videoId: '42' });
  return <><output>{comments.loading ? 'Loading comments' : 'Comments ready'}</output><CommentInput onAddComment={comments.addComment} isAddingComment={false} /></>;
}
function page() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><AuthProvider><Comments /></AuthProvider></QueryClientProvider>);
}
beforeEach(() => {
  localStorage.clear();
  mockClerkUser = null;
  (window.matchMedia as jest.Mock).mockImplementation(query => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  }));
});

it('loads public comments without mounting a standalone wallet session', async () => {
  page();
  await screen.findByText('Comments ready');
  expect(screen.getByText('Please sign in to comment')).toBeInTheDocument();
});

it('uses the Clerk identity for the comment editor without wallet providers', async () => {
  mockClerkUser = { id: 'clerk-A', username: 'Creator', imageUrl: '/avatar.png' };
  page();
  await screen.findByText('Comments ready');
  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  expect(screen.getByAltText('Creator')).toHaveAttribute('src', '/avatar.png');
});
