import * as babel from "@babel/core";
import joySrcBabelPreset from "@symph/joy/dist/build/babel-src/preset-src";
import { RuntimeException } from "@symph/core";
import * as path from "path";

export async function readConfigFile(filePath: string): Promise<Record<string, any>> {
  const extname = path.extname(filePath);
  let config: Record<string, unknown>;
  const module = {} as Record<string, any>;
  let exports = {} as Record<string, any>;

  if (/\.(jsx?|tsx?|mjs)$/.test(extname)) {
    const code = await transFile(filePath);
    // const module = {} as Record<string, any>;
    // let exports = {} as Record<string, any>;
    eval(code);
    config = module.exports || exports.default;
  } else {
    // todo support .yaml
    config = require(filePath);
  }

  if (Object.keys(config).length === 0) {
    console.warn("Detected joy.config.js, no exported configuration found. #empty-configuration");
  }
  return config;
}

async function transFile(filePath: string): Promise<string> {
  let dist: babel.BabelFileResult | null = null;
  const presetItem = babel.createConfigItem(joySrcBabelPreset, { type: "preset" });
  dist = await babel.transformFileAsync(filePath, {
    presets: [presetItem],
  });
  if (!dist) {
    throw new RuntimeException(`load config file(${filePath}) error, compile error.`);
  }
  const { code } = dist;
  if (!code) {
    throw new RuntimeException(`load config file(${filePath}) error, code is nil;`);
  }
  return code;
}
