// @ts-ignore 默认的安装^v3.0.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import path from "path";
import glob from "glob";
import type { LoaderDefinitionFunction } from "webpack";

export type JoyRequireContextLoaderOptions = {
  absolutePath: string;
  regExp?: string;
  globalVar?: "window" | "global";
  globalKey?: string;
  useFileScan?: boolean;
};

const JoyClientGenerateLoader: LoaderDefinitionFunction = async function (): Promise<string> {
  const { absolutePath, regExp, globalVar, globalKey, useFileScan = false } = this.getOptions() as JoyRequireContextLoaderOptions;
  const strAbsolutePath = JSON.stringify(absolutePath);
  const reg = regExp || "/(?<!\\.test|spec|e2e).(jsx?|tsx?|json)$/i";

  let globalCode = "";
  if (globalVar && globalKey) {
    globalCode = `
      if (typeof ${globalVar} !== 'undefined') {
        ${globalVar}.${globalKey} = modules;
      };
  `;
  }
  this.cacheable(false);

  /**
   * 何时采用这种方式：
   * 1. 采用两段编译，第一段编译完成后，立即启动第二段编译，且使用第一段编译输出的结果，使用require.context可能检测不到文件的变化。
   */
  // const callback = this.async();

  if (!useFileScan) {
    return `
  const modules = [];
  const ctx = require.context(${strAbsolutePath}, true, ${reg});
  for (const key of ctx.keys()) {
    modules.push(ctx(key));
  }
  ${globalCode}
  export default modules;
  `;
  } else {
    let modules = [] as string[];
    const paths = Array.isArray(absolutePath) ? absolutePath : [absolutePath];
    for (const path1 of paths) {
      const m = await getDirSourceFiles(path1);
      modules = modules.concat(m);
    }

    const strModules = modules.map((f) => {
      return `modules.push(require("${f}"));\n`;
    });
    const code = `
      const modules = [];
      ${strModules.join("")}
      ${globalCode}
      export default modules;
      `;

    return code;
  }
};

async function getDirSourceFiles(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    try {
      glob("**/*.{js,jsx,ts,tsx,json}", { cwd: dir }, async (err, files) => {
        if (err) {
          reject(err);
        }
        const sourceFiles: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const filePath = files[i];
          let fullPath = path.resolve(dir, filePath);
          fullPath = path.normalize(fullPath);
          fullPath = fullPath.replace(/\\/g, "/");
          sourceFiles.push(fullPath);
        }
        resolve(sourceFiles);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default JoyClientGenerateLoader;
