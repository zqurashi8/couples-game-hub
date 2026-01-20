/**
 * Jest Test Setup
 * Configures the test environment for all tests
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Firebase modules
jest.mock('../js/firebase-config.js', () => ({
  database: {},
  ref: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({ exists: () => false, val: () => null })),
  onValue: jest.fn(),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => Date.now()),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Global test utilities
global.testUtils = {
  /**
   * Create a mock card
   */
  createCard: (color, value, type = 'number') => ({ color, value, type }),

  /**
   * Create a hand of cards
   */
  createHand: (cards) => cards.map(([color, value, type]) =>
    global.testUtils.createCard(color, value, type || 'number')
  ),

  /**
   * Wait for async operations
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
};
