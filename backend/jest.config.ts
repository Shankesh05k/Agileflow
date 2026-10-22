import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: { lines: 20, functions: 20, branches: 15, statements: 20 },
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
};

export default config;