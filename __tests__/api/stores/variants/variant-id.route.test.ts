import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    variant: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

const { auth } = jest.requireMock('@/lib/auth') as { auth: jest.Mock };

import { PATCH } from '@/app/api/stores/[storeId]/variants/[variantId]/route';

describe('/api/stores/[storeId]/variants/[variantId] PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    auth.mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ sku: 'new-sku' }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when variant not found', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/s_1/variants/v_999', {
      method: 'PATCH',
      body: JSON.stringify({ sku: 'new-sku' }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_999' }) });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user tries to update variant from different store', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      product: { id: 'p_1', storeId: 's_2' },
      attributes: {},
    });
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ sku: 'new-sku' }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid patch data', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      product: { id: 'p_1', storeId: 's_1' },
      attributes: {},
    });
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ price: -10 }), // negative price not allowed
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(res.status).toBe(400);
  });

  it('updates variant sku successfully', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      sku: 'old-sku',
      price: 99.99,
      inventory: 10,
      product: { id: 'p_1', storeId: 's_1' },
      attributes: {},
    });
    mockUpdate.mockResolvedValue({
      id: 'v_1',
      sku: 'new-sku',
      price: 99.99,
      inventory: 10,
      attributes: {},
    });
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ sku: 'new-sku' }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.variant.sku).toBe('new-sku');
  });

  it('updates variant price and inventory', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      sku: 'sku-1',
      price: 99.99,
      inventory: 10,
      product: { id: 'p_1', storeId: 's_1' },
      attributes: {},
    });
    mockUpdate.mockResolvedValue({
      id: 'v_1',
      sku: 'sku-1',
      price: 149.99,
      inventory: 25,
      attributes: {},
    });
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ price: 149.99, inventory: 25 }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v_1' },
        data: expect.objectContaining({ price: 149.99, inventory: 25 }),
      })
    );
  });

  it('merges trackInventory flag into attributes', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'STAFF', storeId: 's_1' } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      sku: 'sku-1',
      product: { id: 'p_1', storeId: 's_1' },
      attributes: { color: 'red' },
    });
    mockUpdate.mockResolvedValue({
      id: 'v_1',
      sku: 'sku-1',
      product: { id: 'p_1', storeId: 's_1' },
      attributes: { color: 'red', trackInventory: true },
    });
    const req = new Request('http://localhost/api/stores/s_1/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ trackInventory: true }),
    }) as unknown as NextRequest;
    await PATCH(req, { params: Promise.resolve({ storeId: 's_1', variantId: 'v_1' }) });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({ color: 'red', trackInventory: true }),
        }),
      })
    );
  });

  it('allows super admin to update any store variant', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null } });
    mockFindUnique.mockResolvedValue({
      id: 'v_1',
      product: { id: 'p_1', storeId: 's_999' },
      attributes: {},
    });
    mockUpdate.mockResolvedValue({
      id: 'v_1',
      sku: 'new-sku',
      attributes: {},
    });
    const req = new Request('http://localhost/api/stores/s_999/variants/v_1', {
      method: 'PATCH',
      body: JSON.stringify({ sku: 'new-sku' }),
    }) as unknown as NextRequest;
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 's_999', variantId: 'v_1' }) });
    expect(res.status).toBe(200);
  });
});
