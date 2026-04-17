const playCountQueue = {
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  process: jest.fn(),
  on: jest.fn(),
};

module.exports = { playCountQueue };
