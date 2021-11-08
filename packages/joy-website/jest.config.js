"use strict";

module.exports = {
  testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/src/**/?(*.)+(spec|test).+(ts|tsx|js)", "**/test/**/?(*.)+(spec|test).+(ts|tsx|js)"],
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
  coverageReporters: ["text", "lcov", "cobertura"],
  testEnvironment: "node",
};
