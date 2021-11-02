import chalk from "chalk";
// @ts-ignore 默认的安装v1.4.0 版本和webpack的5的类型定义冲突，所以这里暂时不用校验
import loaderUtils from "loader-utils";
import path from "path";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;
// import { loader } from 'webpack'

const ErrorLoader: loader.Loader = function () {
  const options = loaderUtils.getOptions(this) || {};

  const { reason = "An unknown error has occurred", throwError = true } = options;

  const resource = this._module?.issuer?.resource ?? null;
  const context = this.rootContext ?? this._compiler?.context;

  const issuer = resource ? (context ? path.relative(context, resource) : resource) : null;

  const err = new Error(reason + (issuer ? `\nLocation: ${chalk.cyan(issuer)}` : ""));
  if (!throwError) {
    this.emitWarning(err);
  } else {
    this.emitError(err);
  }
};

export default ErrorLoader;
