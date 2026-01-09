/**
 * MSW Request Handlers - Aggregated exports
 * 
 * Usage in tests:
 *   import { handlers } from '../mocks/handlers';
 *   setupServer(...handlers);
 */

import { authHandlers } from './auth.handlers';
import { ctrHandlers } from './ctr.handlers';

// All handlers combined for the default server setup
export const handlers = [
  ...authHandlers,
  ...ctrHandlers,
];

// Re-export individual handler groups for selective use
export { authHandlers } from './auth.handlers';
export { ctrHandlers } from './ctr.handlers';

// Re-export fixtures for use in tests
export { mockUsers, mockTokens } from './auth.handlers';
export { mockQuota, mockAuditResult, mockGeneratedConcepts, mockFaceReference } from './ctr.handlers';

