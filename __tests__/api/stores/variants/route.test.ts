import { GET } from '@/app/api/stores/[storeId]/variants/route';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindMany = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    variant: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { auth } from '@/lib/auth';

describe('/api/stores/[storeId]/variants GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/variants');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when staff tries to access different store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_2' },
    });
    const req = new Request('http://localhost/api/stores/store_1/variants');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(403);
  });

  it('allows super admin to access any store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindMany.mockResolvedValue([
      {
        id: 'v1',
        sku: 'SKU-001',
        product: { id: 'p1', title: 'Product 1' },
      },
    ]);
    const req = new Request('http://localhost/api/stores/store_1/variants');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('variants');
    expect(json.variants).toHaveLength(1);
  });

  it('allows staff to access their own store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_1' },
    });
    mockFindMany.mockResolvedValue([
      {
        id: 'v1',
        sku: 'SKU-001',
        product: { id: 'p1', title: 'Product 1' },
      },
      {
        id: 'v2',
        sku: 'SKU-002',
        product: { id: 'p1', title: 'Product 1' },
      },
    ]);
    const req = new Request('http://localhost/api/stores/store_1/variants');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.variants).toHaveLength(2);
  });

  it('returns empty variants list', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindMany.mockResolvedValue([]);
    const req = new Request('http://localhost/api/stores/store_1/variants');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.variants).toEqual([]);
  });
});
