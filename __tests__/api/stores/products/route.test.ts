import { GET, POST } from '@/app/api/stores/[storeId]/products/route';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    variant: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { auth } from '@/lib/auth';

describe('/api/stores/[storeId]/products GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/products') as unknown as NextRequest;
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when staff tries to access different store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_2' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products') as unknown as NextRequest;
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(403);
  });

  it('allows super admin to access any store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindMany.mockResolvedValue([
      { id: 'p1', title: 'Product 1', storeId: 'store_1' },
    ]);
    const req = new Request('http://localhost/api/stores/store_1/products') as unknown as NextRequest;
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('products');
    expect(json.storeId).toBe('store_1');
  });

  it('allows staff to access their own store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    mockFindMany.mockResolvedValue([
      { id: 'p1', title: 'Product 1', storeId: 'store_1' },
    ]);
    const req = new Request('http://localhost/api/stores/store_1/products') as unknown as NextRequest;
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.products).toHaveLength(1);
  });
});

describe('/api/stores/[storeId]/products POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'p1',
      title: 'New Product',
      storeId: 'store_1',
    });
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({ title: 'Product', price: 10 }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 for insufficient permissions (customer)', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'CUSTOMER', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({ title: 'Product', price: 10 }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid schema', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('returns 400 when price missing for non-variant product', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Product',
        hasVariants: false,
        images: [{ url: 'http://example.com/image.jpg' }],
      }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Price is required');
  });

  it('returns 400 when variant product has no variants', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Product',
        hasVariants: true,
        variants: [],
        images: [{ url: 'http://example.com/image.jpg' }],
      }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('At least one variant is required');
  });

  it('returns 400 when no images provided', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Product',
        price: 10,
        hasVariants: false,
      }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('At least one image');
  });

  it('creates product with valid data', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Product',
        price: 29.99,
        hasVariants: false,
        images: [{ url: 'http://example.com/image.jpg' }],
      }),
    }) as unknown as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('product');
    expect(json.storeId).toBe('store_1');
  });
});
