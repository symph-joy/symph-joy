"use strict";

module.exports = {
  // globalSetup: './test/lib/jest-setup.js',
  // preset: 'jest-puppeteer',
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/src/**/?(*.)+(spec|test).+(ts|tsx|js)",
    "**/test/**/?(*.)+(spec|test).+(ts|tsx|js)",
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
                plugins: ["@babel/plugin-transform-runtime"],
              },
            },
          },
        ],
      },
    ],
  },
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
  testEnvironment: "node",
};
