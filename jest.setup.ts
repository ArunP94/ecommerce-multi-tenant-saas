// Extend Jest matchers for DOM testing
import '@testing-library/jest-dom';
// Polyfill fetch/Request/Response in jsdom environment
import 'whatwg-fetch';

// Mock next/navigation hooks so components using useRouter/useSearchParams work in tests
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

// Basic mock for NextResponse to avoid importing Next's ESM in tests
jest.mock('next/server', () => {
  const NextResponse = {
    json: (body: unknown, init?: ResponseInit & { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
    redirect: (url: URL | string, status?: number) => Response.redirect(url.toString(), status),
    next: () => new Response(null, { status: 200 }),
  };
  return { NextResponse };
});
