import '@testing-library/jest-dom';

// Silence console.error for React act warnings from Toast animations, etc.
const error = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0] ?? "");
    if (message.includes('act(...)') || message.includes('Not implemented: navigation')) return;
    error(...args);
  };
  // Minimal matchMedia mock for components relying on it
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
