import { act, renderHook, waitFor } from '@testing-library/react';
import useCTREngine from '../useCTREngine';
import { ctrApi } from '../../api/ctr';

jest.mock('@clerk/clerk-react', () => ({ useUser: () => ({ isSignedIn: true, isLoaded: true, user: { id: 'alice' } }) }));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false, user: null, isRestoring: false }) }));
jest.mock('../useStudioBalance', () => ({ useStudioBalance: () => ({ usageAccess: null, isLoadingQuota: false, refreshQuota: jest.fn() }) }));
jest.mock('../../api/ctr', () => ({
  ctrApi: { getNiches: jest.fn(), getFaceReference: jest.fn(), auditThumbnail: jest.fn(), uploadFaceReference: jest.fn() },
  fileToBase64: jest.fn(),
}));
const api = ctrApi as jest.Mocked<typeof ctrApi>;
const failure = (status: number, data: unknown = {}) => ({ isAxiosError: true, message: `Request failed with status code ${status}`, response: { status, data } });

beforeEach(() => {
  api.getNiches.mockResolvedValue([]);
  api.getFaceReference.mockResolvedValue(null as any);
});

it('puts a plain sentence in the error banner instead of "Request failed with status code 503"', async () => {
  api.auditThumbnail.mockRejectedValue(failure(503));
  const { result } = renderHook(() => useCTREngine());
  await act(() => result.current.auditByUrl('https://example.com/thumb.jpg'));
  expect(result.current.error).toBe('The audit did not finish. Please try again.');
  expect(result.current.errorDetail).toBe('HTTP 503');
  expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
  act(() => result.current.clearError());
  expect(result.current.errorDetail).toBeNull();
});

it("keeps the server's message and its code classification", async () => {
  api.auditThumbnail.mockRejectedValue(
    failure(402, { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'You need 2 credits for this audit.' } }),
  );
  const { result } = renderHook(() => useCTREngine());
  await act(() => result.current.auditByUrl('https://example.com/thumb.jpg'));
  await waitFor(() => expect(result.current.error).toBe('You need 2 credits for this audit.'));
  expect(result.current.errorCode).toBe('INSUFFICIENT_CREDITS');
  expect(result.current.errorDetail).toBe('HTTP 402 · INSUFFICIENT_CREDITS');
});

it('classifies free audits used up on the platform apart from the per-network limit', async () => {
  api.auditThumbnail.mockRejectedValue(
    failure(429, { success: false, error: { code: 'ANONYMOUS_AUDIT_CAPACITY', message: 'Free audits are used up for today. Create a free account to get 50 credits.' } }),
  );
  const { result } = renderHook(() => useCTREngine());
  await act(() => result.current.auditByUrl('https://example.com/thumb.jpg'));
  await waitFor(() => expect(result.current.errorCode).toBe('ANONYMOUS_AUDIT_CAPACITY'));
  api.auditThumbnail.mockRejectedValue(failure(429, { success: false, error: { code: 'ANONYMOUS_AUDIT_QUOTA_EXCEEDED', message: 'Free audit limit reached.' } }));
  await act(() => result.current.auditByUrl('https://example.com/thumb.jpg'));
  await waitFor(() => expect(result.current.errorCode).toBe('ANONYMOUS_AUDIT_QUOTA_EXCEEDED'));
});
