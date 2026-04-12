const prisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  artist: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  song: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  album: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  genre: {
    findMany: jest.fn(),
  },
  userPreference: {
    count: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  playHistory: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((fn) => (typeof fn === 'function' ? fn(prisma) : Promise.all(fn))),
  $disconnect: jest.fn(),
};

module.exports = prisma;
