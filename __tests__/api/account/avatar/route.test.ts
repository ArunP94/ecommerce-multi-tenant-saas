import { DELETE } from '@/app/api/account/avatar/route';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockUpdate = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: (...args: unknown[]) => mockUpdate(...args) },
  },
}));

import { auth } from '@/lib/auth';

describe('/api/account/avatar DELETE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('deletes user avatar when authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com' },
    });
    mockUpdate.mockResolvedValue({ id: 'u1', image: null });

    const res = await DELETE();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { image: null },
    });
  });

  it('calls auth to get session', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com' },
    });
    mockUpdate.mockResolvedValue({ id: 'u1', image: null });

    await DELETE();
    expect(auth).toHaveBeenCalled();
  });
});
