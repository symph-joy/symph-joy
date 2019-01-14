'use strict'

module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/*.test.js'],
  verbose: true,
  collectCoverage: false,
  bail: true,
  rootDir: 'test',
  modulePaths: ['<rootDir>/lib'],
  coverageReporters: ['text', 'lcov', 'cobertura'],
  setupTestFrameworkScriptFile: 'expect-puppeteer'
}
