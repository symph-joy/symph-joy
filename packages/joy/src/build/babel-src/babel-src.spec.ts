import * as babel from "@babel/core";
import joySrcBabelPreset from "./preset-src";
import path from "path";
import { ClassSimple } from "./fixtures/class-simple";
import { getComponentMeta } from "@symph/core";
import { getConfigValuesMetadata } from "@symph/config";

function evalModuleCode(code: string): Record<string, any> {
  const exports = {};
  eval(code);
  return exports;
}

function transAndLoadFile(file: string, opts?: babel.TransformOptions): Record<string, any> {
  const result = babel.transformFileSync(file, opts);
  const { code, ast } = result!;
  const mod = evalModuleCode(code!);
  return mod;
}

describe("babel src", () => {
  let presetItem: babel.ConfigItem;
  beforeAll(async () => {
    presetItem = babel.createConfigItem(joySrcBabelPreset, { type: "preset" });
  });

  test(`Transform as simple class.`, async () => {
    const mod = transAndLoadFile(path.resolve(__dirname, "fixtures/class-simple.ts"), {
      presets: [presetItem],
    });
    expect(typeof mod.ClassSimple).toBe("function");
  });

  test(`Transform class with @Component decorator.`, async () => {
    const mod = transAndLoadFile(path.resolve(__dirname, "fixtures/class-component.ts"), {
      presets: [presetItem],
    });
    const clazz = mod.TestClass;
    const classMete = getComponentMeta(clazz);
    expect(classMete?.name).toBe("aTestClass");

    const propMeta = getConfigValuesMetadata(clazz);
    expect(propMeta?.length).toBe(1);
    expect(propMeta![0]).toMatchObject({ propKey: "configValue" });
  });

  test(`Transform react class component.`, async () => {
    const mod = transAndLoadFile(path.resolve(__dirname, "fixtures/react-class.tsx"), {
      ast: true,
      presets: [presetItem],
    });
    const clazz = mod.TestClass;
    const instance = new clazz({ msg: "hello" });
    expect(instance).toHaveProperty("props.msg", "hello");
  });

  test(`Should ignore require not js code.`, async () => {
    let mod: Record<string, any> = {};
    let transError: Error | undefined = undefined;
    try {
      mod = transAndLoadFile(path.resolve(__dirname, "fixtures/require-ignore-not-js.ts"), {
        ast: true,
        presets: [presetItem],
      });
    } catch (e) {
      transError = e;
    }
    expect(transError).toBeUndefined();
    expect(mod.requireCss).toMatchObject({ thisIsEmptyModule: true });
    expect(mod.importCssModule).toMatchObject({ thisIsEmptyModule: true });
  });
});
