import { findStoreByHost } from '@/lib/stores';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('findStoreByHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds store by custom domain', async () => {
    (prisma.store.findFirst as jest.Mock).mockResolvedValue({
      id: 'store_1',
      slug: 'my-store',
      customDomain: 'mystore.com',
    });

    const result = await findStoreByHost('mystore.com');
    expect(result).toEqual({
      id: 'store_1',
      slug: 'my-store',
      customDomain: 'mystore.com',
    });
    expect(prisma.store.findFirst).toHaveBeenCalledWith({
      where: { customDomain: 'mystore.com' },
      select: { id: true, slug: true, customDomain: true },
    });
  });

  it('finds store by slug when custom domain not found', async () => {
    (prisma.store.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store_2',
      slug: 'my-shop',
      customDomain: null,
    });

    const result = await findStoreByHost('my-shop');
    expect(result).toEqual({
      id: 'store_2',
      slug: 'my-shop',
      customDomain: null,
    });
    expect(prisma.store.findUnique).toHaveBeenCalledWith({
      where: { slug: 'my-shop' },
      select: { id: true, slug: true, customDomain: true },
    });
  });

  it('returns null when store not found', async () => {
    (prisma.store.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await findStoreByHost('nonexistent.com');
    expect(result).toBeNull();
  });

  it('tries custom domain first, then slug', async () => {
    (prisma.store.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'store_3',
      slug: 'fallback-store',
    });

    await findStoreByHost('test-host');
    expect(prisma.store.findFirst).toHaveBeenCalled();
    expect(prisma.store.findUnique).toHaveBeenCalled();
    expect((prisma.store.findFirst as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (prisma.store.findUnique as jest.Mock).mock.invocationCallOrder[0]
    );
  });

  it('returns custom domain result without calling slug query', async () => {
    const customDomainStore = {
      id: 'store_1',
      slug: 'my-store',
      customDomain: 'custom.com',
    };
    (prisma.store.findFirst as jest.Mock).mockResolvedValue(customDomainStore);

    const result = await findStoreByHost('custom.com');
    expect(result).toEqual(customDomainStore);
    expect(prisma.store.findUnique).not.toHaveBeenCalled();
  });
});
