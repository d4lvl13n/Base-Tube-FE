import React, { useEffect } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Per-user IndexedDB namespace (src/contexts/UploadQueueContext.tsx).
 *
 * The provider derives the queue's storage namespace as 'loading' while Clerk
 * has not answered yet, else the CLERK user id when one is present (it takes
 * precedence), else the web3 user id, else 'anonymous'. Clerk goes first
 * because linking a wallet also sets the web3 user for a Clerk account; a
 * web3-first order flipped the namespace mid-session and remounted the queue.
 * The inner provider is keyed on the namespace, so a REAL identity change
 * REMOUNTS the queue rather than letting the next account read the previous
 * account's drafts.
 */

const mockUseUser = jest.fn();
const mockUseAuth = jest.fn();
const mockUseUploadQueue = jest.fn();
const mockPurgeLegacyResumeDatabases = jest.fn();

// Partial mock: NON_DURABLE_NAMESPACES stays REAL so the provider's gate is
// exercised against the SDK's actual set; only the purge side effect is spied.
jest.mock('@basetube/api', () => ({
  ...jest.requireActual('@basetube/api'),
  purgeLegacyResumeDatabases: () => mockPurgeLegacyResumeDatabases(),
}));
jest.mock('@clerk/clerk-react', () => ({
  useUser: () => mockUseUser(),
}));
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
jest.mock('../../hooks/useUploadQueue', () => ({
  useUploadQueue: (options: unknown) => mockUseUploadQueue(options),
}));
jest.mock('../../components/upload/UploadQueuePanel', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../../components/common/Notifications/ErrorToast', () => ({
  showInfoToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

// eslint-disable-next-line import/first
import { UploadQueueProvider } from '../UploadQueueContext';

/** The minimal queue shape the provider itself reads. */
function queueStub() {
  return {
    entries: [],
    paused: false,
    hydrated: true,
    persistenceError: null,
    selectionNotice: null,
    actionError: null,
    activeCount: 0,
    remainingSessionSlots: 50,
  };
}

let mounts = 0;
const Probe: React.FC = () => {
  useEffect(() => {
    mounts += 1;
  }, []);
  return null;
};

function renderProvider() {
  return render(
    <MemoryRouter>
      <UploadQueueProvider>
        <Probe />
      </UploadQueueProvider>
    </MemoryRouter>,
  );
}

function lastNamespace(): string | undefined {
  const call = mockUseUploadQueue.mock.calls[mockUseUploadQueue.mock.calls.length - 1];
  return (call?.[0] as { storageNamespace?: string } | undefined)?.storageNamespace;
}

beforeEach(() => {
  jest.clearAllMocks();
  mounts = 0;
  mockUseUploadQueue.mockImplementation(() => queueStub());
  mockUseUser.mockReturnValue({ user: null, isLoaded: true });
  mockUseAuth.mockReturnValue({ user: null });
});

describe('UploadQueueProvider storage namespace', () => {
  it('uses the Clerk user id, even when a web3 user is also present', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });

    renderProvider();

    expect(lastNamespace()).toBe('clerk-user-1');
  });

  it('uses the Clerk user id when there is no web3 session', () => {
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });

    renderProvider();

    expect(lastNamespace()).toBe('clerk-user-1');
  });

  it('falls back to the web3 user id when Clerk has loaded with nobody signed in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });

    renderProvider();

    expect(lastNamespace()).toBe('web3-user-9');
  });

  it('stays "loading" while Clerk has not answered, even if a web3 user is already known', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });
    mockUseUser.mockReturnValue({ user: undefined, isLoaded: false });

    renderProvider();

    expect(lastNamespace()).toBe('loading');
  });

  it('uses "anonymous" when Clerk has loaded and nobody is signed in', () => {
    renderProvider();

    expect(lastNamespace()).toBe('anonymous');
  });

  it('uses "loading" while Clerk has not answered yet', () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoaded: false });

    renderProvider();

    expect(lastNamespace()).toBe('loading');
  });

  // The namespace is also the inner provider's React key: a different account
  // must get a freshly mounted (re-hydrated) queue, not a patched-up one.
  it('remounts the queue subtree when the identity changes', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });
    const { rerender } = renderProvider();
    expect(mounts).toBe(1);
    expect(lastNamespace()).toBe('web3-user-9');

    // A Clerk session appears for a different account: the namespace changes.
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });
    rerender(
      <MemoryRouter>
        <UploadQueueProvider>
          <Probe />
        </UploadQueueProvider>
      </MemoryRouter>,
    );

    expect(lastNamespace()).toBe('clerk-user-1');
    // The key changed: the whole subtree, probe included, mounted again.
    expect(mounts).toBe(2);
  });

  // Linking a wallet mid-session sets the web3 user for the SAME Clerk account.
  // That must not flip the namespace (and abort an in-flight transfer).
  it('does not remount when a web3 user appears later for the same Clerk session', () => {
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });
    const { rerender } = renderProvider();
    expect(mounts).toBe(1);
    expect(lastNamespace()).toBe('clerk-user-1');

    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });
    rerender(
      <MemoryRouter>
        <UploadQueueProvider>
          <Probe />
        </UploadQueueProvider>
      </MemoryRouter>,
    );

    expect(lastNamespace()).toBe('clerk-user-1');
    expect(mounts).toBe(1);
  });

  it('does not remount while the identity stays the same', () => {
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });
    const { rerender } = renderProvider();
    expect(mounts).toBe(1);

    rerender(
      <MemoryRouter>
        <UploadQueueProvider>
          <Probe />
        </UploadQueueProvider>
      </MemoryRouter>,
    );

    expect(mounts).toBe(1);
    expect(lastNamespace()).toBe('clerk-user-1');
  });
});

// The databases that predate per-user namespacing (un-namespaced, 'anonymous',
// 'loading') hold records belonging to nobody identifiable. They are purged
// once — and only once — an identity is known; an unidentified session must
// not trigger anything.
describe('UploadQueueProvider legacy database purge', () => {
  it('purges once a Clerk identity is known', () => {
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });

    renderProvider();

    expect(mockPurgeLegacyResumeDatabases).toHaveBeenCalledTimes(1);
  });

  it('purges once a web3 identity is known', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'web3-user-9' } });

    renderProvider();

    expect(mockPurgeLegacyResumeDatabases).toHaveBeenCalledTimes(1);
  });

  it('does not purge while the namespace is "anonymous"', () => {
    renderProvider();

    expect(lastNamespace()).toBe('anonymous');
    expect(mockPurgeLegacyResumeDatabases).not.toHaveBeenCalled();
  });

  it('does not purge while the namespace is "loading"', () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoaded: false });

    renderProvider();

    expect(lastNamespace()).toBe('loading');
    expect(mockPurgeLegacyResumeDatabases).not.toHaveBeenCalled();
  });

  it('purges exactly when the session goes from loading to a real identity', () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoaded: false });
    const { rerender } = renderProvider();
    expect(mockPurgeLegacyResumeDatabases).not.toHaveBeenCalled();

    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });
    rerender(
      <MemoryRouter>
        <UploadQueueProvider>
          <Probe />
        </UploadQueueProvider>
      </MemoryRouter>,
    );

    expect(lastNamespace()).toBe('clerk-user-1');
    expect(mockPurgeLegacyResumeDatabases).toHaveBeenCalledTimes(1);
  });

  it('does not purge again on re-renders with the same identity', () => {
    mockUseUser.mockReturnValue({ user: { id: 'clerk-user-1' }, isLoaded: true });
    const { rerender } = renderProvider();

    rerender(
      <MemoryRouter>
        <UploadQueueProvider>
          <Probe />
        </UploadQueueProvider>
      </MemoryRouter>,
    );

    expect(mockPurgeLegacyResumeDatabases).toHaveBeenCalledTimes(1);
  });
});
