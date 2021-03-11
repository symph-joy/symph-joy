'use strict'
const babelJest = require('babel-jest')

module.exports = {
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/react',
    '<rootDir>/packages/joy',
  ],
  globalSetup: './test/lib/jest-setup.js',
}
