/**
 * Shared delay helper for mock API responses.
 * Simulates network latency so the UI behaves realistically during development.
 */
export const mockDelay = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
