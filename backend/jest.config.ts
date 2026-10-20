import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
  },
  coverageDirectory: 'coverage',
  setupFiles: ['<rootDir>/tests/setup.ts'],
};

export default config;
