jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));

const { auth } = jest.requireMock('@/lib/auth') as { auth: jest.Mock };

import { POST } from '@/app/api/me/store/route';

describe('/api/me/store POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    auth.mockResolvedValue(null);
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's_123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when storeId is missing', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STORE_OWNER', storeId: 's_123' } });
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Missing storeId' });
  });

  it('returns 404 when store not found', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STORE_OWNER', storeId: 's_123' } });
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's_999' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: 'Store not found' });
  });

  it('returns 403 when non-admin user accesses different store', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_111' } });
    mockFindUnique.mockResolvedValue({ id: 's_222' });
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's_222' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toEqual({ error: 'Forbidden' });
  });

  it('allows super admin to access any store', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null } });
    mockFindUnique.mockResolvedValue({ id: 's_999' });
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's_999' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('allows store owner to access own store', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STORE_OWNER', storeId: 's_123' } });
    mockFindUnique.mockResolvedValue({ id: 's_123' });
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's_123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('trims whitespace from storeId', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null } });
    mockFindUnique.mockResolvedValue({ id: 's_123' });
    const req = new Request('http://localhost/api/me/store', {
      method: 'POST',
      body: JSON.stringify({ storeId: '  s_123  ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 's_123' }, select: { id: true } });
  });
});
