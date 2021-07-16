"use strict";

module.exports = {
  // globalSetup: './test/lib/jest-setup.js',
  preset: "jest-playwright-preset",
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/src/**/?(*.)+(e2e).+(ts|tsx|js)",
    "**/test/**/?(*.)+(e2e).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: [
          "@babel/preset-env",
          {
            env: {
              test: {
                plugins: [["@babel/plugin-transform-runtime"]],
              },
            },
          },
        ],
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/",
    "/packages/joy/dist",
    "/packages/react/dist",
    "/packages/core/dist",
    "/packages/server/dist",
    "\\.pnp\\.[^\\/]+$",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: true,
  collectCoverage: false,
  bail: true,
  // rootDir: 'test',
  // 'roots': [
  //   '<rootDir>/src',
  // ],
  // modulePaths: ['<rootDir>/packages/'],
  coverageReporters: ["text", "lcov", "cobertura"],
  // testEnvironment: "node",
};
