import { jest } from '@jest/globals';

export default {
  subscribe: jest.fn(() => {
    // return an unsubscribe mock
    return jest.fn();
  }),
  disableTracking: jest.fn(),
};