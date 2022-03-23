import * as babel from "@babel/core";
import joySrcBabelPreset from "./preset-src";
import path from "path";
import { getComponentMeta } from "@symph/core";
import { getConfigValuesMetadata } from "@symph/config";

import { writeFileSync, existsSync, removeSync } from "fs-extra";

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

function transFiles(files: string[], dist = "dist", opts?: babel.TransformOptions) {
  for (const file of files) {
    const filePath = path.resolve(__dirname, "fixtures", file);
    const distFile = path.resolve(__dirname, "fixtures", dist, path.basename(file).slice(0, path.basename(file).lastIndexOf(".")) + ".js");
    if (existsSync(distFile)) {
      removeSync(distFile);
    }
    const result = babel.transformFileSync(filePath, opts);
    const { code, ast } = result!;

    writeFileSync(distFile, code as string);
  }
}

describe("babel src", () => {
  let presetItem: babel.ConfigItem;
  beforeAll(async () => {
    presetItem = babel.createConfigItem(joySrcBabelPreset, { type: "preset" });
  });

  test(`Transform a simple hello class.`, async () => {
    transFiles(["hello-class.ts"], "dist", {
      presets: [presetItem],
    });

    const mod = require("./fixtures/dist/hello-class");
    expect(typeof mod.HelloClass).toBe("function");
    const aHelloClass = new mod.HelloClass("hello");
    expect(aHelloClass.msg).toBeUndefined();
    expect(aHelloClass.hello()).toBe(undefined);
  });

  test(`Transform a normal function.`, async () => {
    transFiles(["hello-fun.ts"], "dist", {
      presets: [presetItem],
    });
    const mod = require("./fixtures/dist/hello-fun");
    expect(typeof mod.HelloFun).toBe("function");
    expect(() => mod.HelloFun()).toThrowError(/joy-scan/);
    // expect(mod.HelloFun()).toBeUndefined();
  });

  test(`Transform a decorator function，with '// @joy-scan' `, async () => {
    transFiles(["class-decorator.ts"], "dist", {
      presets: [presetItem],
    });
    const mod = require("./fixtures/dist/class-decorator");

    expect(typeof mod.ClassDecorator).toBe("function");
    expect(typeof mod.ClassDecorator()).toBe("function");
    expect(typeof mod.ClassDecorator.PropDecorator).toBe("function");
    expect(typeof mod.ClassDecorator.PropDecorator()).toBe("function");
  });

  test(`Transform class with @Component decorator.`, async () => {
    transFiles(["class-component.ts"], "dist", {
      presets: [presetItem],
    });
    const mod = require("./fixtures/dist/class-component");

    const clazz = mod.ClassComponent;
    const classMete = getComponentMeta(clazz);
    expect(classMete?.name).toBe("aClassComponent");

    const propMeta = getConfigValuesMetadata(clazz);
    expect(propMeta?.length).toBe(1);
    expect(propMeta![0]).toMatchObject({ propKey: "configValue" });
  });

  test(`Transform react class component.`, async () => {
    transFiles(["react-class.tsx"], "dist", {
      presets: [presetItem],
    });
    const mod = require("./fixtures/dist/react-class");
    const clazz = mod.ReactClass;
    const instance = new clazz();
    expect(instance.render()).toBeUndefined();
  });

  describe("ignore unused imports", () => {
    test(`Should ignore imported module, which is not a js module.`, async () => {
      transFiles(["require-ignore-not-js.ts"], "dist", {
        presets: [presetItem],
      });
      const mod = require("./fixtures/dist/require-ignore-not-js");

      expect(mod.requireCss).toMatchObject({ thisIsEmptyModule: true });
      expect(mod.importCssModule).toMatchObject({ thisIsEmptyModule: true });
    });

    test(`Should ignore imported module, which is not used during the loading.`, async () => {
      transFiles(["class-component.ts", "class-decorator.ts", "hello-class.ts", "ignore-none-used-module-host.ts"], "dist", {
        ast: true,
        presets: [presetItem],
      });
      const mod = require("./fixtures/dist/ignore-none-used-module-host");
      console.log(mod);
      expect(typeof mod.IgnoreNoneUsedModuleHost).toBe("function");

      const instance = new mod.IgnoreNoneUsedModuleHost();
      expect(instance.helloClass).toBeUndefined();
    });
  });
});
