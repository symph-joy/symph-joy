import _fetch from "isomorphic-fetch";

function fetch(url, options) {
  if (typeof window !== "undefined") {
    const regHost = new RegExp(
      `^https?://${window.location.host.replace(/\./g, "\\.")}`,
      "i"
    );
    // in browser
    if (!regHost.test(url) && options.mode !== "cors") {
      // 跨域了！！, 且没有明确指定cors模式，则走代理模式，来解决跨域问题。
      return proxy(url, options);
    } else {
      // 未跨域，直接发送请求
      return _fetch(url, options);
    }
  } else {
    // in server
    return _fetch(url, options);
  }
}

/**
 * 跨域请求走server端代理，解决跨域问题
 */
function proxy(url, options = {}) {
  let { headers, proxyPath = "/__proxy", proxyPrefix } = options;

  if (proxyPrefix || !proxyPath) {
    // 保存对v1.2.1之前的版本兼容
    proxyPath = proxyPrefix;
  }

  if (!headers) {
    options.headers = headers = {};
  }
  if (/^\/\//.test(url)) {
    url = window.location.protocol + url;
  }
  const urlObj = new URL(url);
  headers["X-Proxy-Target"] = urlObj.origin;
  const proxyUrl = `${proxyPath}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
  return _fetch(proxyUrl, options);
}

export default fetch;
export { proxy };
