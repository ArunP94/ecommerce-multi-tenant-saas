import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockDeleteProduct = jest.fn();
const mockFindMany = jest.fn();
const mockDeleteVariant = jest.fn();
const mockDeleteImage = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDeleteProduct(...args),
    },
    variant: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      deleteMany: (...args: unknown[]) => mockDeleteVariant(...args),
    },
    image: {
      deleteMany: (...args: unknown[]) => mockDeleteImage(...args),
    },
  },
}));

const { auth } = jest.requireMock('@/lib/auth') as { auth: jest.Mock };

import { GET, PUT, DELETE } from '@/app/api/stores/[storeId]/products/[productId]/route';

describe('/api/stores/[storeId]/products/[productId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      auth.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1') as unknown as NextRequest;
      const res = await GET(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin user accessing different store', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_111' } });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1') as unknown as NextRequest;
      const res = await GET(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 404 when product not found', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1') as unknown as NextRequest;
      const res = await GET(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(404);
    });

    it('returns 404 when product store does not match', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_2', variants: [], images: [] });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1') as unknown as NextRequest;
      const res = await GET(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(404);
    });

    it('returns product with variants and images', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      const product = { id: 'p_1', storeId: 's_1', title: 'Test', variants: [], images: [] };
      mockFindUnique.mockResolvedValue(product);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1') as unknown as NextRequest;
      const res = await GET(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.product).toEqual(product);
    });
  });

  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      auth.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 403 when product not found (security - no enumeration)', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 403 when user tries to update product from different store', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_2' });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid update data', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_1', title: 'Test', sku: 'sku-1', metadata: {} });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ title: '' }), // too short
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(400);
    });

    it('returns 400 when SKU is duplicate', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_1', title: 'Test', sku: 'old-sku', metadata: {}, hasVariants: false });
      mockFindFirst.mockResolvedValue({ id: 'p_2' }); // existing product with this SKU
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ sku: 'existing-sku' }),
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('SKU already exists');
    });

    it('updates product successfully', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      const existing = { id: 'p_1', storeId: 's_1', title: 'Old', sku: 'sku-1', metadata: {}, hasVariants: false };
      mockFindUnique.mockResolvedValue(existing);
      mockFindFirst.mockResolvedValue(null); // SKU is unique
      mockUpdate.mockResolvedValue({ ...existing, title: 'Updated' });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }) as unknown as NextRequest;
      const res = await PUT(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      auth.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 when product not found', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(404);
    });

    it('returns 403 when user deletes product from different store', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_2' });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(403);
    });

    it('deletes product and its variants/images', async () => {
      auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
      mockFindUnique.mockResolvedValue({ id: 'p_1', storeId: 's_1' });
      mockFindMany.mockResolvedValue([{ id: 'v_1' }, { id: 'v_2' }]);
      mockDeleteImage.mockResolvedValue({ count: 5 });
      mockDeleteVariant.mockResolvedValue({ count: 2 });
      mockDeleteProduct.mockResolvedValue({ id: 'p_1' });
      const req = new Request('http://localhost/api/stores/s_1/products/p_1', { method: 'DELETE' }) as unknown as NextRequest;
      const res = await DELETE(req, { params: Promise.resolve({ storeId: 's_1', productId: 'p_1' }) });
      expect(res.status).toBe(200);
      expect(mockDeleteProduct).toHaveBeenCalledWith({ where: { id: 'p_1' } });
    });
  });
});
