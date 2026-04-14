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
  // POST /api/v1/web3auth/nonce - Request nonce for wallet signature
  http.post(`${API_BASE}/api/v1/web3auth/nonce`, async ({ request }) => {
    await delay(100);
    
    const body = await request.json() as { walletAddress?: string };
    const walletAddress = body?.walletAddress;
    
    if (!walletAddress) {
      return HttpResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return HttpResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    const nonce = `mock-nonce-${Date.now()}`;

    return HttpResponse.json({
      nonce,
      message: `BaseTube wallet verification\n\nSign this message to prove you control this wallet.\nWallet: ${walletAddress.toLowerCase()}\nNonce: ${nonce}`
    });
  }),

  // POST /api/v1/web3auth/login - Verify signature and authenticate
  http.post(`${API_BASE}/api/v1/web3auth/login`, async ({ request }) => {
    await delay(150);
    
    const body = await request.json() as { 
      walletAddress?: string;
      signature?: string;
    };
    
    if (!body?.walletAddress || !body?.signature) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Simulate invalid signature
    if (body.signature === 'invalid-signature') {
      return HttpResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      user: {
        ...mockUsers.web3User,
        web3auth: {
          ...mockUsers.web3User.web3auth,
          wallet_address: body.walletAddress.toLowerCase(),
        },
      },
      created: false,
    });
  }),

  // POST /api/v1/web3auth/signup - Verify signature and create account
  http.post(`${API_BASE}/api/v1/web3auth/signup`, async ({ request }) => {
    await delay(150);

    const body = await request.json() as {
      walletAddress?: string;
      signature?: string;
    };

    if (!body?.walletAddress || !body?.signature) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.signature === 'invalid-signature') {
      return HttpResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: {
        ...mockUsers.web3User,
        web3auth: {
          ...mockUsers.web3User.web3auth,
          wallet_address: body.walletAddress.toLowerCase(),
        },
      },
    }, { status: 201 });
  }),

  // POST /api/v1/web3auth/link - Link wallet to existing account
  http.post(`${API_BASE}/api/v1/web3auth/link`, async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as { 
      walletAddress?: string;
      signature?: string;
    };
    
    if (!body?.walletAddress || !body?.signature) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      web3auth: {
        wallet_address: body.walletAddress.toLowerCase(),
        chain_id: 8453,
      },
      message: 'Wallet linked successfully',
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
