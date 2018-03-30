import _fetch from 'isomorphic-fetch'


function fetch(url, options) {
  if (typeof window !== 'undefined') {
    const regProtocol = new RegExp(`(https?:)?\/\/`, 'i');
    const regHost = new RegExp(`(https?:)?\/\/${window.location.host.replace(/\./g, '\\.')}`, 'i');
    // in browser
    if (regProtocol.test(url) && !regHost.test(url) && options.mode !== 'cors') {
      // 跨域了！！, 且没有明确指定cors模式，则走代理模式，来解决跨域问题。
      return proxy(url, options)
    } else {
      // 为跨域，直接发送请求
      return _fetch(url, options)
    }
  } else {
    // in server
    return _fetch(url, options)
  }
}

/**
 * 跨域请求走server端代理，解决跨域问题
 */
function proxy(url, options) {
  let req = {
    url,
    options,
  }
  const headerNames = [];
  if (options.headers) {
    for (let p in options.headers) {
      if(options.headers.hasOwnProperty(p)){
        headerNames.push(p);
      }
    }
  } else {
    options.headers = {};
  }

  options.headers['__Payload'] = headerNames;

  console.log(`>>>>> request by proxy. url:${url}, headers:${headerNames}`)
  return _fetch('/__proxy?uri=' + encodeURIComponent(url), options)
}

export default fetch
