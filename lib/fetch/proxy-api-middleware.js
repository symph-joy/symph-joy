import request from 'request'

function createProxyApiMiddleware ({proxyPrefix = ''} = {}) {
  let proxyUrlMath = new RegExp(`^${proxyPrefix}/__proxy`, 'i')

  return async function proxy (req, res, next) {
    if (!proxyUrlMath.test(req.url)) {
      next()
      return
    }

    let uri = req.query.uri
    if (!uri) {
      res.send('the url is required')
      res.end()
      return
    }
    // let method = (req.method || 'GET').toLocaleUpperCase();
    // let contentType = req.get('Content-Type');
    // let headerNames = req.get('__Payload');
    // let body = null;
    //
    // console.log(`>>>> api proxy start,${process.uptime()}, method:${method}, uri:${uri}, headers:${headerNames}`);
    //
    // const sOptions = {
    //   url: uri,
    //   method,
    // };

    req.pipe(request(uri)).pipe(res)
  }
}

export {createProxyApiMiddleware}
