import { POST } from '@/app/api/super-admin/stores/route';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockStoreFindUnique = jest.fn();
const mockStoreCreate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: {
      create: (...args: unknown[]) => mockStoreCreate(...args),
      findUnique: (...args: unknown[]) => mockStoreFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

import { auth } from '@/lib/auth';

describe('/api/super-admin/stores POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreFindUnique.mockResolvedValue(null);
    mockStoreCreate.mockResolvedValue({
      id: 'store_1',
      name: 'Test Store',
      slug: 'test-store',
      customDomain: null,
      ownerId: 'u1',
      settings: {},
    });
  });

  it('returns 403 when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/super-admin/stores', {
      method: 'POST',
      body: JSON.stringify({ name: 'Store', ownerEmail: 'owner@example.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 403 when not super admin', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER' },
    });
    const req = new Request('http://localhost/api/super-admin/stores', {
      method: 'POST',
      body: JSON.stringify({ name: 'Store', ownerEmail: 'owner@example.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid schema', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN' },
    });
    const req = new Request('http://localhost/api/super-admin/stores', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when not super admin', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER' },
    });
    const req = new Request('http://localhost/api/super-admin/stores', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Store',
        ownerEmail: 'owner@example.com',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
