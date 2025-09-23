import { POST } from '@/app/api/account/route';

jest.mock('@/lib/auth', () => ({
  auth: async () => ({ user: { id: 'u1', role: 'SUPER_ADMIN' } }),
}));

const update = jest.fn().mockResolvedValue({ id: 'u1', name: 'New Name', image: null });
jest.mock('@/lib/prisma', () => ({
  prisma: { user: { update: (...args: unknown[]) => update(...args) } },
}));

describe('/api/account POST', () => {
  it('updates name and returns JSON', async () => {
    const req = new Request('http://localhost/api/account', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'New Name' }).toString(),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, user: { id: 'u1', name: 'New Name', image: null } });
    expect(update).toHaveBeenCalled();
  });

  it('returns 400 without name', async () => {
    const req = new Request('http://localhost/api/account', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams().toString(),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});