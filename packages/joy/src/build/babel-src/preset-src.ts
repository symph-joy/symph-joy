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

  return {
    sourceType: "unambiguous",
    presets: [[require("@babel/preset-typescript"), { allowNamespaces: true }]],
    plugins: [
      [
        require("../babel/plugins/jsx-pragma"),
        {
          module: "react",
          importAs: "React",
          pragma: "__jsx",
          property: "createElement",
        },
      ],
      "babel-plugin-transform-typescript-metadata",
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      [require("@babel/plugin-proposal-class-properties"), { loose: true }],
      require("styled-jsx/babel"),
      [require("@babel/plugin-proposal-optional-chaining"), { loose: true }], // parse: a?.b?.c, 岛屿
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      // require("./plugins/ingore-require-not-js-babel-plugin"),
      require("./plugins/class-scan-babel-plugin"),
      require("@babel/plugin-transform-modules-commonjs"),
    ].filter(Boolean),
  };
}

export default joySrcBabelPreset;
