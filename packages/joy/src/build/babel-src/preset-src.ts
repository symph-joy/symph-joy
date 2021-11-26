import { PluginItem, BabelFile } from "@babel/core";

type JoySrcBabelPresetOptions = {};

type BabelPreset = {
  presets?: PluginItem[] | null;
  plugins?: PluginItem[] | null;
  sourceType?: "script" | "module" | "unambiguous";
  overrides?: Array<{ test: RegExp } & Omit<BabelPreset, "overrides">>;
};

// Taken from https://github.com/babel/babel/commit/d60c5e1736543a6eac4b549553e107a9ba967051#diff-b4beead8ad9195361b4537601cc22532R158
function supportsStaticESM(caller: any): boolean {
  return !!caller?.supportsStaticESM;
}

export function joySrcBabelPreset(api: any, options: JoySrcBabelPresetOptions = {}): BabelPreset {
  const supportsESM = api.caller(supportsStaticESM);

  const presetEnvConfig = {
    node: "current",
    loose: true,
  };

  // specify a preset to use instead of @babel/preset-env
  // const customModernPreset = isLaxModern && options["experimental-modern-preset"];

  return {
    sourceType: "unambiguous",
    presets: [
      //   customModernPreset || [require("@babel/preset-env").default, presetEnvConfig],
      //   [
      //     require("@babel/preset-react"),
      //     {
      //       // This adds @babel/plugin-transform-react-jsx-source and
      //       // @babel/plugin-transform-react-jsx-self automatically in development
      //       development: isDevelopment || isTest,
      //       pragma: "__jsx",
      //       ...options["preset-react"],
      //     },
      //   ],
      [require("@babel/preset-typescript"), { allowNamespaces: true }],
    ],
    plugins: [
      // [require("./plugins/joy-import-babel-plugin"), { isServer: isServer }],
      // [require("./plugins/joy-auto-css-modules")],
      [
        require("../babel/plugins/jsx-pragma"),
        {
          // This produces the following injected import for modules containing JSX:
          //   import React from 'react';
          //   var __jsx = React.createElement;
          module: "react",
          importAs: "React",
          pragma: "__jsx",
          property: "createElement",
        },
      ],
      // [
      //   require("./plugins/optimize-hook-destructuring"),
      //   {
      //     // only optimize hook functions imported from React/Preact
      //     lib: true,
      //   },
      // ],
      // require("@babel/plugin-syntax-dynamic-import"),
      // require("./plugins/react-loadable-plugin"),
      "babel-plugin-transform-typescript-metadata",
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      [require("@babel/plugin-proposal-class-properties"), { loose: true }],
      // [
      //   require("@babel/plugin-proposal-object-rest-spread"),
      //   {
      //     useBuiltIns: true,
      //   },
      // ],
      // !isServer && [
      //   require("@babel/plugin-transform-runtime"),
      //   {
      //     corejs: false,
      //     helpers: true,
      //     regenerator: true,
      //     useESModules: supportsESM && presetEnvConfig.modules !== "commonjs",
      //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //     // @ts-ignore
      //     absoluteRuntime: process.versions.pnp ? __dirname : undefined,
      //     ...options["transform-runtime"],
      //   },
      // ],
      // [isTest && options["styled-jsx"] && options["styled-jsx"]["babel-test"] ? require("styled-jsx/babel-test") : require("styled-jsx/babel"), styledJsxOptions(options["styled-jsx"])],
      require("styled-jsx/babel"),
      // require("./plugins/amp-attributes"),
      // isProduction && [
      //   require("babel-plugin-transform-react-remove-prop-types"),
      //   {
      //     removeImport: true,
      //   },
      // ],
      // require("@babel/plugin-proposal-optional-chaining"),
      // require("@babel/plugin-proposal-nullish-coalescing-operator"),
      // isServer && require("@babel/plugin-syntax-bigint"),
      // [require("@babel/plugin-proposal-numeric-separator").default, false],
      // require("@babel/plugin-proposal-export-namespace-from"),
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      require("./plugins/ingore-require-not-js-babel-plugin"),
      require("@babel/plugin-transform-modules-commonjs"),
    ].filter(Boolean),
  };
}

export default joySrcBabelPreset;
