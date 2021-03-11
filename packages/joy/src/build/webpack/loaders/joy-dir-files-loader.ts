// import { loader } from 'webpack'
// @ts-ignore 默认的安装v1.4.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import loaderUtils from "loader-utils";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;

export type JoyClientGenerateFileLoaderOptions = {
  absolutePath: string;
  regExp?: string;
};

const JoyClientGenerateLoader: loader.Loader = function () {
  const { absolutePath, regExp } = loaderUtils.getOptions(
    this
  ) as JoyClientGenerateFileLoaderOptions;
  const strAbsolutePath = JSON.stringify(absolutePath);
  const reg = regExp || "/.(jsx?|tsx?|json)$/i";
  return `
     (function () {
        const ctx = require.context(${strAbsolutePath}, true, ${reg});
      })()
  `;
};

export default JoyClientGenerateLoader;
