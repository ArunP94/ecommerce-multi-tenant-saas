import { getBaseDomain, normalizeHost, isSubdomainOfBase, extractSlugFromHost } from '@/lib/domain';

describe('domain utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getBaseDomain', () => {
    it('returns localhost when no env var set', () => {
      delete process.env.PLATFORM_BASE_DOMAIN;
      delete process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;
      expect(getBaseDomain()).toBe('localhost');
    });

    it('returns domain from PLATFORM_BASE_DOMAIN', () => {
      process.env.PLATFORM_BASE_DOMAIN = 'example.com';
      expect(getBaseDomain()).toBe('example.com');
    });

    it('returns domain from NEXT_PUBLIC_PLATFORM_BASE_DOMAIN', () => {
      process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = 'app.example.com';
      expect(getBaseDomain()).toBe('app.example.com');
    });

    it('strips protocol from domain', () => {
      process.env.PLATFORM_BASE_DOMAIN = 'https://example.com';
      expect(getBaseDomain()).toBe('example.com');
    });

    it('strips port from domain', () => {
      process.env.PLATFORM_BASE_DOMAIN = 'example.com:3000';
      expect(getBaseDomain()).toBe('example.com');
    });

    it('prefers PLATFORM_BASE_DOMAIN over NEXT_PUBLIC_PLATFORM_BASE_DOMAIN', () => {
      process.env.PLATFORM_BASE_DOMAIN = 'primary.com';
      process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = 'secondary.com';
      expect(getBaseDomain()).toBe('primary.com');
    });
  });

  describe('normalizeHost', () => {
    it('removes port from host', () => {
      expect(normalizeHost('example.com:3000')).toBe('example.com');
    });

    it('converts to lowercase', () => {
      expect(normalizeHost('EXAMPLE.COM')).toBe('example.com');
    });

    it('handles subdomain', () => {
      expect(normalizeHost('shop.EXAMPLE.COM:8080')).toBe('shop.example.com');
    });

    it('returns normalized host without changes', () => {
      expect(normalizeHost('example.com')).toBe('example.com');
    });
  });

  describe('isSubdomainOfBase', () => {
    beforeEach(() => {
      process.env.PLATFORM_BASE_DOMAIN = 'example.com';
    });

    it('returns true for valid subdomain', () => {
      expect(isSubdomainOfBase('shop.example.com')).toBe(true);
    });

    it('returns false for base domain itself', () => {
      expect(isSubdomainOfBase('example.com')).toBe(false);
    });

    it('returns false for unrelated domain', () => {
      expect(isSubdomainOfBase('other.com')).toBe(false);
    });

    it('handles case insensitivity', () => {
      expect(isSubdomainOfBase('SHOP.EXAMPLE.COM')).toBe(true);
    });

    it('handles port numbers', () => {
      expect(isSubdomainOfBase('shop.example.com:3000')).toBe(true);
    });

    it('returns true for multi-level subdomain', () => {
      expect(isSubdomainOfBase('api.shop.example.com')).toBe(true);
    });

    it('returns false for partial domain match', () => {
      expect(isSubdomainOfBase('notexample.com')).toBe(false);
    });
  });

  describe('extractSlugFromHost', () => {
    beforeEach(() => {
      process.env.PLATFORM_BASE_DOMAIN = 'example.com';
    });

    it('extracts slug from subdomain', () => {
      expect(extractSlugFromHost('shop.example.com')).toBe('shop');
    });

    it('returns null for base domain', () => {
      expect(extractSlugFromHost('example.com')).toBeNull();
    });

    it('returns null for unrelated domain', () => {
      expect(extractSlugFromHost('other.com')).toBeNull();
    });

    it('extracts first label only from multi-level subdomain', () => {
      expect(extractSlugFromHost('api.shop.example.com')).toBe('api');
    });

    it('handles case insensitivity', () => {
      expect(extractSlugFromHost('SHOP.EXAMPLE.COM')).toBe('shop');
    });

    it('handles port numbers', () => {
      expect(extractSlugFromHost('shop.example.com:3000')).toBe('shop');
    });

    it('returns null for port-only base domain', () => {
      expect(extractSlugFromHost('example.com:3000')).toBeNull();
    });
  });
});
