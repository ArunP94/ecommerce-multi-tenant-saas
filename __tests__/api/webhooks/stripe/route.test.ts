import { POST } from '@/app/api/webhooks/stripe/route';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: { update: jest.fn() },
  },
}));

describe('stripe webhook route', () => {
  it('updates order on checkout.session.completed with orderId', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orderId: 'order_1' } } },
    });

    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: 'raw',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'PAID' } });
  });

  it('returns 400 on invalid signature', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('bad sig');
    });

    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: 'raw',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
