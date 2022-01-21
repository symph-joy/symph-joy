"use strict";

module.exports = {
  projects: [
    "<rootDir>/packages/core",
    "<rootDir>/packages/config",
    "<rootDir>/packages/server",
    "<rootDir>/packages/react",
    "<rootDir>/packages/joy/jest.config.js",
    "<rootDir>/packages/joy/jest.config.e2e.js",
  ],
  globalSetup: "./test/lib/jest-setup.js",
  testTimeout: 60000,
};
