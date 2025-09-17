import '@testing-library/jest-dom';

// Silence console.error for React act warnings from Toast animations, etc.
const error = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0] ?? "");
    if (message.includes('act(...)') || message.includes('Not implemented: navigation')) return;
    error(...args);
  };
});
afterAll(() => {
  console.error = error;
});
