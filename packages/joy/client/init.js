import PageLoader from "../lib/page-loader";
import * as asset from "../lib/asset";
import * as envConfig from "../lib/runtime-config";

// Polyfill Promise globally
// This is needed because Webpack's dynamic loading(common chunks) code
// depends on Promise.O
// So, we need to polyfill it.
// See: https://webpack.js.org/guides/code-splitting/#dynamic-imports
if (!window.Promise) {
  window.Promise = Promise;
}

const {
  __JOY_DATA__: {
    // props,
    // err,
    // page,
    // pathname,
    // query,
    buildId,
    assetPrefix,
    runtimeConfig,
    // initStoreState
  },
  // location
} = window;

const prefix = assetPrefix || "";

// With dynamic assetPrefix it's no longer possible to set assetPrefix at the build time
// So, this is how we do it in the client side at runtime
__webpack_public_path__ = `${prefix}/_joy/`; //eslint-disable-line
// Initialize @symph/joy/asset with the assetPrefix
asset.setAssetPrefix(prefix);
// Initialize @symph/joy/config with the environment configuration
envConfig.setConfig({
  serverRuntimeConfig: {},
  publicRuntimeConfig: runtimeConfig,
});

const pageLoader = new PageLoader(buildId, prefix);
window.__JOY_LOADED_PAGES__.forEach(({ route, fn }) => {
  pageLoader.registerPage(route, fn);
});
delete window.__JOY_LOADED_PAGES__;
window.__JOY_REGISTER_PAGE = pageLoader.registerPage.bind(pageLoader);
