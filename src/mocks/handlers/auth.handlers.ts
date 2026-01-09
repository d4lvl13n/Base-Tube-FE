/**
 * MSW Handlers for Authentication APIs
 * Covers both Web3 and standard auth flows
 */

import { http, HttpResponse, delay } from 'msw';

// Base API URL - matches src/api/index.ts
const API_BASE = process.env.REACT_APP_API_URL || '';

// ============================================================
// FIXTURES
// ============================================================

export const mockUsers = {
  web3User: {
    id: 'user-web3-123',
    username: 'web3user',
    email: null,
    profile_image_url: 'https://example.com/avatar.png',
    web3auth: {
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
      chain_id: 8453,
    },
    created_at: '2024-01-01T00:00:00Z',
  },
  clerkUser: {
    id: 'user-clerk-456',
    username: 'clerkuser',
    email: 'clerk@example.com',
    profile_image_url: 'https://example.com/clerk-avatar.png',
    web3auth: null,
    created_at: '2024-01-01T00:00:00Z',
  },
};

export const mockTokens = {
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXdlYjMtMTIzIiwiZXhwIjoxOTk5OTk5OTk5fQ.mock',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXdlYjMtMTIzIiwiZXhwIjoxMDAwMDAwMDAwfQ.expired',
};

// ============================================================
// WEB3 AUTH HANDLERS
// ============================================================

export const web3AuthHandlers = [
  // POST /api/v1/web3/nonce - Request nonce for wallet signature
  http.post(`${API_BASE}/api/v1/web3/nonce`, async ({ request }) => {
    await delay(100);
    
    const body = await request.json() as { wallet_address?: string };
    const walletAddress = body?.wallet_address;
    
    if (!walletAddress) {
      return HttpResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return HttpResponse.json(
        { success: false, message: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        nonce: `Sign this message to authenticate with Base.Tube: ${Date.now()}`,
        expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      },
    });
  }),

  // POST /api/v1/web3/verify - Verify signature and authenticate
  http.post(`${API_BASE}/api/v1/web3/verify`, async ({ request }) => {
    await delay(150);
    
    const body = await request.json() as { 
      wallet_address?: string;
      signature?: string;
      nonce?: string;
    };
    
    if (!body?.wallet_address || !body?.signature || !body?.nonce) {
      return HttpResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Simulate invalid signature
    if (body.signature === 'invalid-signature') {
      return HttpResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          ...mockUsers.web3User,
          web3auth: {
            ...mockUsers.web3User.web3auth,
            wallet_address: body.wallet_address,
          },
        },
        token: mockTokens.validToken,
      },
    });
  }),

  // POST /api/v1/web3/link - Link wallet to existing account
  http.post(`${API_BASE}/api/v1/web3/link`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as { 
      wallet_address?: string;
      signature?: string;
    };
    
    if (!body?.wallet_address || !body?.signature) {
      return HttpResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          ...mockUsers.clerkUser,
          web3auth: {
            wallet_address: body.wallet_address,
            chain_id: 8453,
          },
        },
        message: 'Wallet linked successfully',
      },
    });
  }),
];

// ============================================================
// SESSION / USER HANDLERS
// ============================================================

export const sessionHandlers = [
  // GET /api/v1/users/me - Get current user profile
  http.get(`${API_BASE}/api/v1/users/me`, async ({ request }) => {
    await delay(50);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Check for expired token
    if (token === mockTokens.expiredToken) {
      return HttpResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: mockUsers.web3User,
    });
  }),

  // PATCH /api/v1/users/me - Update user profile
  http.patch(`${API_BASE}/api/v1/users/me`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockUsers.web3User,
        ...body,
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // DELETE /api/v1/users/me - Delete account
  http.delete(`${API_BASE}/api/v1/users/me`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  }),
];

// ============================================================
// AUTH TOKEN HANDLERS
// ============================================================

export const tokenHandlers = [
  // POST /api/v1/auth/refresh - Refresh access token
  http.post(`${API_BASE}/api/v1/auth/refresh`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { success: false, message: 'No refresh token provided' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        token: mockTokens.validToken,
        expiresIn: 3600,
      },
    });
  }),

  // POST /api/v1/auth/logout - Invalidate session
  http.post(`${API_BASE}/api/v1/auth/logout`, async () => {
    await delay(50);
    
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),
];

// ============================================================
// COMBINED HANDLERS
// ============================================================

export const authHandlers = [
  ...web3AuthHandlers,
  ...sessionHandlers,
  ...tokenHandlers,
];

