/**
 * Security Rules Verification Spec (Dirty Dozen Assertions)
 * Documents expected PERMISSION_DENIED outcomes for /users/{userId} and /test/{docId}.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated get on /users/u1',
    operation: 'get',
    path: '/users/u1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-user get on /users/victim',
    operation: 'get',
    path: '/users/victim',
    auth: { uid: 'attacker', email: 'attacker@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'User collection list scraping',
    operation: 'list',
    path: '/users',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified email create on /users/u1',
    operation: 'create',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: false },
    payload: { uid: 'u1', email: 'u1@gmail.com', name: 'Test', authProvider: 'google' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Identity spoofing uid mismatch',
    operation: 'create',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: { uid: 'victim', email: 'u1@gmail.com', name: 'Test', authProvider: 'google' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow field injection (isAdmin: true)',
    operation: 'create',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: { uid: 'u1', email: 'u1@gmail.com', name: 'Test', authProvider: 'google', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Balance injection on profile update',
    operation: 'update',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: { name: 'Test', balance: 50000 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable createdAt tampering on update',
    operation: 'update',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: { name: 'Test', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Spoofed client timestamp on create',
    operation: 'create',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: {
      uid: 'u1',
      email: 'u1@gmail.com',
      name: 'Test',
      authProvider: 'google',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized name (>100 chars)',
    operation: 'create',
    path: '/users/u1',
    auth: { uid: 'u1', email: 'u1@gmail.com', email_verified: true },
    payload: {
      uid: 'u1',
      email: 'u1@gmail.com',
      name: 'A'.repeat(101),
      authProvider: 'google',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid path ID poisoning',
    operation: 'create',
    path: '/users/bad$id',
    auth: { uid: 'bad$id', email: 'u1@gmail.com', email_verified: true },
    payload: { uid: 'bad$id', email: 'u1@gmail.com', name: 'Test', authProvider: 'google' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Admin email spoof with email_verified=false',
    operation: 'get',
    path: '/users/victim',
    auth: { uid: 'spoof', email: 'aroy327154@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
];
