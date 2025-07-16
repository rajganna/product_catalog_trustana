// Global test setup
// Add any global mocks or configurations here

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep native behavior for error and warn
  error: jest.fn(),
  warn: jest.fn(),
  // Mock info and debug to reduce test output noise
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
}

// Set timezone for consistent date testing
process.env.TZ = 'UTC'

// Mock process.env variables commonly used in tests
process.env.NODE_ENV = 'test'
