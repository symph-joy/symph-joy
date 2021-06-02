// import { loader } from 'webpack'
// @ts-ignore 默认的安装v1.4.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import loaderUtils from "loader-utils";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;
import * as path from "path";
import * as fs from "fs";

export type JoyClientGenerateFileLoaderOptions = {
  absolutePath: string;
};

const joyClientGenerateLoader: loader.Loader = function () {
  const { absolutePath } = loaderUtils.getOptions(
    this
  ) as JoyClientGenerateFileLoaderOptions;
  const strAbsolutePath = JSON.stringify(absolutePath);

  // if (!fs.existsSync(absolutePath)) {
  //   console.warn('joy auto generated dir is not exists,', absolutePath)
  //   return `
  //    (function () {
  //       const modules = window.__JOY_AUTOGEN || []
  //       window.__JOY_AUTOGEN = modules
  //     })()
  // `
  // }

  return `
     (function () {
        const modules = window.__JOY_AUTOGEN || []
        const ctx = require.context(${strAbsolutePath}, true, /\\.(jsx?|tsx?|json)$/i);
        for (const key of ctx.keys()) {
          modules.push(ctx(key))
        }
        // modules.push(require('${absolutePath}/index.js'))
        window.__JOY_AUTOGEN = modules
        // return modules
      })()
  `;
};

export default joyClientGenerateLoader;
