import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindUnique = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

const { auth } = jest.requireMock('@/lib/auth') as { auth: jest.Mock };

import { DELETE, POST } from '@/app/api/super-admin/stores/[storeId]/route';

describe('/api/super-admin/stores/[storeId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE', () => {
    it('returns 403 when not authenticated', async () => {
      auth.mockResolvedValue(null);
      const req = new Request('http://localhost/api/super-admin/stores/s_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 403 when non-super-admin tries to delete', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STORE_OWNER', storeId: 's_1' } });
      const req = new Request('http://localhost/api/super-admin/stores/s_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 404 when store not found', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } });
      mockFindUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/super-admin/stores/s_999', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_999' }) });
      expect(res.status).toBe(404);
    });

    it('deletes store successfully', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } });
      mockFindUnique.mockResolvedValue({ id: 's_1', name: 'Store' });
      mockDelete.mockResolvedValue({ id: 's_1' });
      const req = new Request('http://localhost/api/super-admin/stores/s_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ ok: true });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 's_1' } });
    });
  });

  describe('POST with method override', () => {
    it('returns 400 for unsupported POST without _method', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } });
      const req = new Request('http://localhost/api/super-admin/stores/s_1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ some: 'data' }),
      }) as unknown as NextRequest;
      const res = await POST(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toEqual({ error: 'Unsupported' });
    });

    it('handles _method=DELETE override via form-urlencoded', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } });
      mockFindUnique.mockResolvedValue({ id: 's_1', name: 'Store' });
      mockDelete.mockResolvedValue({ id: 's_1' });
      const req = new Request('http://localhost/api/super-admin/stores/s_1', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: '_method=DELETE',
      }) as unknown as NextRequest;
      const res = await POST(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ ok: true });
    });

    it('returns 403 on method override DELETE when not super-admin', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      const req = new Request('http://localhost/api/super-admin/stores/s_1', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: '_method=DELETE',
      }) as unknown as NextRequest;
      const res = await POST(req, { params: Promise.resolve({ storeId: 's_1' }) });
      expect(res.status).toBe(403);
    });
  });
});
