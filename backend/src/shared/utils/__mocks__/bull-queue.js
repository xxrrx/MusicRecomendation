const playCountQueue = {
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  process: jest.fn(),
  on: jest.fn(),
};

const chartQueue = {
  add: jest.fn().mockResolvedValue({ id: 'mock-chart-job-id' }),
  process: jest.fn(),
  on: jest.fn(),
};

module.exports = { playCountQueue, chartQueue };
