// Mock heavy next-auth internals to avoid ESM issues in tests
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
// Provide a functional default export for CredentialsProvider used by lib/auth
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: () => ({ type: 'credentials' }),
}));

import { authOptions } from '@/lib/auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

describe('auth callbacks', () => {
  it('jwt sets role, storeId, image from user', async () => {
    const token: Partial<JWT> = {};
    const user = { role: 'SUPER_ADMIN', storeId: 'store_1', image: 'http://img' } as const;
    // @ts-expect-error - simplify callback invocation in tests
    const out = await authOptions.callbacks!.jwt!({ token: token as JWT, user });
    expect(out).toMatchObject({ role: 'SUPER_ADMIN', storeId: 'store_1', image: 'http://img' });
  });

  it('session copies data from token to session.user', async () => {
    const baseSession = { user: {} } as unknown as Session;
    const token: Partial<JWT> = { role: 'STAFF', storeId: null, sub: 'user_1', image: 'http://img' };
    // @ts-expect-error - simplify callback invocation in tests
    const out = await authOptions.callbacks!.session!({ session: baseSession, token: token as JWT });
    expect(out.user).toMatchObject({ id: 'user_1', role: 'STAFF', storeId: null, image: 'http://img' });
  });
});
