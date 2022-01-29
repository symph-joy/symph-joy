"use strict";

module.exports = {
  projects: [
    "<rootDir>/packages/joy/jest.config.e2e.js",
    "<rootDir>/packages/core",
    "<rootDir>/packages/config",
    "<rootDir>/packages/server",
    "<rootDir>/packages/react",
    "<rootDir>/packages/joy/jest.config.js",
  ],
  globalSetup: "./test/lib/jest-setup.js",
  testTimeout: typeof v8debug === "object" ? 1000 * 60 * 60 : 60000,
};
