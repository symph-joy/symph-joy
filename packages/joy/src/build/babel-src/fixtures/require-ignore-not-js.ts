import "./assets/css-test.css";

// @ts-ignore just for test
import _importCssModule from "./assets/css-test.css";
export const importCssModule = _importCssModule;

export const requireCss = require("./assets/css-test.css");

function test() {
  // 不在模块加载是运算，则不受影响。
  // @ts-ignore just for test
  const dynamicLoadCss = import("./assets/css-test.css");
}
