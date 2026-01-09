/**
 * Jest Test Setup
 * 
 * IMPORTANT: Polyfills must be set BEFORE any other imports!
 * This is because MSW requires TextEncoder to be available during module load.
 */

// ============================================================
// POLYFILLS (inline, before any imports)
// ============================================================

// Setup TextEncoder/TextDecoder for wagmi/viem/msw compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for Node environment (needed before MSW)
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// ============================================================
// NOW we can safely import modules that depend on polyfills
// ============================================================

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// MSW Server for API mocking
// Note: MSW v2 has compatibility issues with Jest/CRA in Node 18+
// For now, unit tests use jest.mock() instead. MSW handlers are available
// for future integration tests or browser testing.
let server: any = null;
try {
  server = require('./mocks/server').server;
} catch {
  // MSW not available - this is expected in current environment
  // Unit tests will work fine without it
}

// ============================================================
// BROWSER API MOCKS
// ============================================================

// Mock window.matchMedia for styled-components/framer-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Mock window.location
const locationMock = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: locationMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

(global as any).ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
}

(global as any).IntersectionObserver = IntersectionObserverMock;

// ============================================================
// MSW Server Lifecycle
// ============================================================

if (server) {
  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  // Reset handlers after each test (important for test isolation)
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });
}
