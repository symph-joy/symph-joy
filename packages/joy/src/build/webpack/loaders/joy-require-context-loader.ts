// import { loader } from 'webpack'
// @ts-ignore 默认的安装v1.4.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import loaderUtils from "loader-utils";
import { webpack5 } from "../../../types/webpack5";
import path from "path";
import glob from "glob";
import loader = webpack5.loader;

export type JoyRequireContextLoaderOptions = {
  absolutePath: string;
  regExp?: string;
  globalVar?: "window" | "global";
  globalKey?: string;
  useFileScan?: boolean;
};

const JoyClientGenerateLoader: loader.Loader = function () {
  const { absolutePath, regExp, globalVar, globalKey, useFileScan = false } = loaderUtils.getOptions(this) as JoyRequireContextLoaderOptions;
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
    /**
     * 何时采用这种方式：
     * 1. 采用两段编译，第一段编译完成后，立即启动第二段编译，且使用第一段编译输出的结果，使用require.context可能检测不到文件的变化。
     */
    const callback = this.async();
    glob("**/*.{js,jsx,ts,tsx,json}", { cwd: absolutePath }, async (err, files) => {
      if (err && callback) {
        callback(err);
      }
      const sourceFiles: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        let fullPath = path.resolve(absolutePath, filePath);
        fullPath = path.normalize(fullPath);
        fullPath = fullPath.replace(/\\/g, "/");
        sourceFiles.push(fullPath);
      }

      const modules = sourceFiles.map((f) => {
        return `modules.push(require("${f}"));\n`;
      });
      const code = `
      const modules = [];
      ${modules.join("")}
      ${globalCode}
      export default modules;
      `;
      callback && callback(undefined, code);
    });
  }
};

export default JoyClientGenerateLoader;
