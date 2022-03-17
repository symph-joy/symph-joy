// import { loader } from 'webpack'
// @ts-ignore 默认的安装v1.4.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import loaderUtils from "loader-utils";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;

export type ClientPagesLoaderOptions = {
  absolutePagePath: string;
  page: string;
};

const joyClientPagesLoader: loader.Loader = function () {
  const { absolutePagePath, page } = loaderUtils.getOptions(this) as ClientPagesLoaderOptions;
  const stringifiedAbsolutePagePath = JSON.stringify(absolutePagePath);
  const stringifiedPage = JSON.stringify(page);

  return `
    (window.__JOY_P = window.__JOY_P || []).push([
      ${stringifiedPage},
      function () {
        return require(${stringifiedAbsolutePagePath});
      }
    ]);
  `;
};

export default joyClientPagesLoader;
