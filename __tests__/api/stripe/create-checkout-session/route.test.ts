import { POST } from '@/app/api/stripe/create-checkout-session/route';

import { stripe } from '@/lib/stripe';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://example.com/checkout' }),
      },
    },
  },
}));

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  });

describe('create-checkout-session route', () => {
  it('returns id and url on success', async () => {
    const req = makeRequest({ storeId: 's1', items: [{ name: 'X', price: 1.23, quantity: 1 }] });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: 'cs_test_123', url: 'https://example.com/checkout' });
  });

  it('returns 500 on Stripe error', async () => {
    (stripe.checkout.sessions.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const req = makeRequest({ storeId: 's1', items: [{ name: 'X', price: 1.23, quantity: 1 }] });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });
});
