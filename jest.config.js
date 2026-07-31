module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/tests'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/index.ts',
      '!src/types.ts',
      '!src/tests/**',
      '!src/integration-tests/**'
    ],
    coverageThreshold: {
      global: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80
      }
    }
};
