// import { loader } from 'webpack'
import hash from "string-hash";
import { basename } from "path";
import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;

const joyDataLoader: loader.Loader = function () {
  const filename = this.resourcePath;
  return `
  import {createHook} from 'joy/data'

  export default createHook(undefined, {key: ${JSON.stringify(
    basename(filename) + "-" + hash(filename)
  )}})
  `;
};

export default joyDataLoader;
