/**
 * MSW Server Setup for Jest/Node environment
 * 
 * This server intercepts HTTP requests made during tests and returns
 * mock responses defined in the handlers.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create the mock server with default handlers
export const server = setupServer(...handlers);

// Export for custom handler setup in individual tests
export { handlers };

