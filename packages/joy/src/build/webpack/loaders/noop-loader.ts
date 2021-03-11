// import { loader } from 'webpack'

import { webpack5 } from "../../../types/webpack5";
import loader = webpack5.loader;

const NoopLoader: loader.Loader = (source) => source;
export default NoopLoader;
