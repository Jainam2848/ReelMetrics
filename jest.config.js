module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      compilerOptions: {
        module: 'commonjs',
        moduleResolution: 'node',
        rootDir: '.',
        noEmit: false,
        isolatedModules: true,
      }
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['lib/ai/scoring-engine.ts'],
  coverageDirectory: 'coverage',
};
