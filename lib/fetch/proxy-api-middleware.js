import httpProxy from 'http-proxy'
import modifyResponse from 'node-http-proxy-json'

function createProxyApiMiddleware ({proxyPrefix = ''} = {}) {
  let proxyUrlMath = new RegExp(`^${proxyPrefix}/__proxy`, 'i')
  let proxyServer = httpProxy.createProxyServer({})

  // for log
  proxyServer.on('proxyReq', function (proxyReq, req, res, options) {
    console.log(`api proxy onReq, method:${req.method}, url:${req.url}, body:${req.body || ''}`)
  })

  proxyServer.on('proxyRes', function (proxyRes, req, res) {
    modifyResponse(res, proxyRes, function (body) {
      console.log(`api proxy onRes, method:${req.method}, url:${req.url}, status:${res.statusCode}, body:${JSON.stringify(body)}`)
      return body
    })
  })

  return async function proxy (req, res, next) {
    if (!proxyUrlMath.test(req.url)) {
      next()
      return
    }
    let uri = req.query.uri
    if (!uri) {
      res.send('the uri is required')
      res.end()
      return
    }

    req.url = uri

    try {
      proxyServer.web(req, res, {target: uri, ignorePath: true})
    } catch (e) {
      console.log('api proxy request error:' + e)
    }
  }
}

export {createProxyApiMiddleware}
