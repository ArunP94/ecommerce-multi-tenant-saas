import { POST } from '@/app/api/auth/forgot-password/route';

const mockSendMail = jest.fn();
jest.mock('@/lib/mail', () => ({
  sendMail: (...args: unknown[]) => mockSendMail(...args),
}));

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    passwordResetToken: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

describe('/api/auth/forgot-password POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'token_1', token: 'abc123', userId: 'u1', userEmail: 'test@example.com', expiresAt: new Date() });
    mockSendMail.mockResolvedValue(true);
  });

  it('returns ok=true when user not found', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'notfound@example.com' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  it('returns ok=true without email in body', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  it('creates password reset token and sends email for existing user', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', name: 'Test' });
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(mockCreate).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sends email with reset link', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', name: 'Test' });
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    await POST(req);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Reset your password',
      })
    );
  });

  it('handles email sending failure gracefully', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', name: 'Test' });
    mockSendMail.mockRejectedValue(new Error('Mail failed'));
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});
