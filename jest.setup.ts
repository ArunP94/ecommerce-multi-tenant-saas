import '@testing-library/jest-dom';
import 'whatwg-fetch';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
  };
});

jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    cookies = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
    };
  }
  const NextResponse = {
    json: (body: unknown, init?: ResponseInit & { status?: number }) => {
      const response = new MockNextResponse(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
      return response;
    },
    redirect: (url: URL | string, status?: number) => Response.redirect(url.toString(), status),
    next: () => new Response(null, { status: 200 }),
  };
  return { NextResponse };
});

const error = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0] ?? "");
    if (message.includes('act(...)') || message.includes('Not implemented: navigation')) return;
    error(...args);
  };
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});
afterAll(() => {
  console.error = error;
});
