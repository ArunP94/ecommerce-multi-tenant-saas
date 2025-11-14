import { GET, PATCH } from '@/app/api/stores/[storeId]/settings/route';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import { auth } from '@/lib/auth';

describe('/api/stores/[storeId]/settings GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/settings');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when staff tries to access different store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_2' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 when store not found', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/settings');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(404);
  });

  it('returns store settings', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    mockFindUnique.mockResolvedValue({
      settings: {
        currency: 'GBP',
        categories: ['Men', 'Women'],
      },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings).toEqual({
      currency: 'GBP',
      categories: ['Men', 'Women'],
    });
  });

  it('allows super admin to access any store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindUnique.mockResolvedValue({
      settings: { currency: 'USD' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings');
    const res = await GET(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
  });
});

describe('/api/stores/[storeId]/settings PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'USD' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when staff tries to update different store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STAFF', storeId: 'store_2' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'USD' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid schema', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 123 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 when store not found', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'USD' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(404);
  });

  it('updates currency setting', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    mockFindUnique.mockResolvedValue({
      settings: { currency: 'GBP' },
    });
    mockUpdate.mockResolvedValue({
      settings: { currency: 'USD' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'USD' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('merges home settings with existing', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    mockFindUnique.mockResolvedValue({
      settings: {
        currency: 'GBP',
        home: { title: 'Original Title' },
      },
    });
    mockUpdate.mockResolvedValue({
      settings: {
        currency: 'GBP',
        home: { title: 'Updated Title', subtitle: 'New Subtitle' },
      },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        home: { title: 'Updated Title', subtitle: 'New Subtitle' },
      }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
  });

  it('updates categories', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'STORE_OWNER', storeId: 'store_1' },
    });
    mockFindUnique.mockResolvedValue({
      settings: {},
    });
    mockUpdate.mockResolvedValue({
      settings: { categories: ['Men', 'Women', 'Kids'] },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ categories: ['Men', 'Women', 'Kids'] }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
  });

  it('allows super admin to update any store', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', storeId: null },
    });
    mockFindUnique.mockResolvedValue({
      settings: {},
    });
    mockUpdate.mockResolvedValue({
      settings: { currency: 'EUR' },
    });
    const req = new Request('http://localhost/api/stores/store_1/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'EUR' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ storeId: 'store_1' }) });
    expect(res.status).toBe(200);
  });
});
