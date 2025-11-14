import { POST } from '@/app/api/auth/reset-password/route';

const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: (...args: unknown[]) => mockUpdate(...args) },
    passwordResetToken: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (password: string) => `hashed_${password}`),
}));

describe('/api/auth/reset-password POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 without token', async () => {
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'newpass' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Invalid' });
  });

  it('returns 400 without password', async () => {
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Invalid' });
  });

  it('returns 400 when token not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid', password: 'newpass' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Invalid' });
  });

  it('returns 400 when token is expired', async () => {
    const expiredTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    mockFindUnique.mockResolvedValue({
      id: 'token_1',
      token: 'abc123',
      userId: 'u1',
      userEmail: 'test@example.com',
      expiresAt: expiredTime,
    });
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123', password: 'newpass' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Invalid' });
  });

  it('successfully resets password with valid token', async () => {
    const futureTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
    mockFindUnique.mockResolvedValue({
      id: 'token_1',
      token: 'abc123',
      userId: 'u1',
      userEmail: 'test@example.com',
      expiresAt: futureTime,
    });
    mockUpdate.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
    mockDelete.mockResolvedValue({ id: 'token_1' });

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123', password: 'newpass123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('updates user with hashed password', async () => {
    const futureTime = new Date(Date.now() + 1000 * 60 * 60);
    mockFindUnique.mockResolvedValue({
      id: 'token_1',
      token: 'abc123',
      userId: 'u1',
      userEmail: 'test@example.com',
      expiresAt: futureTime,
    });
    mockUpdate.mockResolvedValue({ id: 'u1' });
    mockDelete.mockResolvedValue({});

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123', password: 'secret' }),
    });
    await POST(req);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { hashedPassword: 'hashed_secret' },
      })
    );
  });

  it('deletes token after successful reset', async () => {
    const futureTime = new Date(Date.now() + 1000 * 60 * 60);
    mockFindUnique.mockResolvedValue({
      id: 'token_1',
      token: 'abc123',
      userId: 'u1',
      userEmail: 'test@example.com',
      expiresAt: futureTime,
    });

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc123', password: 'newpass' }),
    });
    await POST(req);
    expect(mockDelete).toHaveBeenCalledWith({ where: { token: 'abc123' } });
  });
});
