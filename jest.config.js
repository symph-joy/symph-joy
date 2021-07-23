'use strict'

module.exports = {
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/config',
    '<rootDir>/packages/server',
    '<rootDir>/packages/react',
    '<rootDir>/packages/joy',
    '<rootDir>/packages/joy/jest.config.e2e.js',
  ],
  globalSetup: './test/lib/jest-setup.js',
}
