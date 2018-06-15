import httpProxy from 'http-proxy'
import modifyResponse from 'node-http-proxy-json'

var streamBuffers = require('stream-buffers')

function createProxyApiMiddleware ({proxyPrefix = '', onReq, onProxyReq, onProxyRes, onProxyResBody, onError, dev = false} = {}) {
  let proxyUrlMatch = new RegExp(`^${proxyPrefix}/__proxy(/[^/?]*)?`, 'i')
  let proxyServer = httpProxy.createProxyServer({})

  proxyServer.on('proxyReq', function (proxyReq, req, res, options) {
    if (onProxyReq && (typeof onProxyReq === 'function')) {
      onProxyReq(proxyReq, req, res, options)
    }
    if (dev) {
      console.log(`api proxy onReq, method:${req.method}, url:${req.url}, body:${req.body || ''}`)
    }
  })

  proxyServer.on('proxyRes', function (proxyRes, req, res) {
    if (onProxyRes && (typeof onProxyRes === 'function')) {
      onProxyRes(proxyRes, req, res)
    }
    modifyResponse(res, proxyRes, function (body) {
      if (onProxyResBody && (typeof onProxyResBody === 'function')) {
        body = onProxyResBody(proxyRes, req, res, body) || body
      }
      if (dev) {
        console.log(`api proxy onRes, method:${req.method}, url:${req.url}, status:${res.statusCode}, body:${JSON.stringify(body)}`)
      }
      return body
    })
  })

  proxyServer.on('error', function (err, req, res) {
    if (onError && (typeof onError === 'function')) {
      onError(err, req, res)
    }
    if (dev) {
      console.log(`api proxy onError, method:${req.method}, url:${req.url}, status:${(res && res.statusCode) || '--'}}`)
    }
  })

  return async function proxy (req, res, next) {
    let match = proxyUrlMatch.exec(req.url)
    if (!match) {
      next()
      return
    }

    let uri = req.query.uri
    // try to get from url
    if (!uri && match[1] && match[1].length > 1) {
      uri = decodeURIComponent(match[1].substr(1))
    }
    if (!uri) {
      res.send('proxy: uri param is required')
      res.end()
      return
    }
    req.url = uri

    let reqBody = []
    req.on('data', (chunk) => {
      reqBody.push(chunk)
    }).on('end', () => {
      if (onReq && (typeof onReq === 'function')) {
        reqBody = Buffer.concat(reqBody)
        // Enable developers to modify the req, if isDestroyed  is not null, the request will ignore.
        let newBody = onReq(req, res, reqBody, next)
        if (newBody instanceof Buffer) {
          reqBody = newBody
        } else if (newBody.hasOwnProperty('body')) {
          if (newBody.isDestroyed) {
            // will ignore this request
            return
          }
          reqBody = newBody.body
        } else {
          console.error('proxy-api-middleware, the return value of onReq(), must be a Buffer, or an object, eg:{body :Buffer, isDestroyed :bool}')
        }
      }
      const bodyStream = new streamBuffers.ReadableStreamBuffer({
        frequency: 10,   // in milliseconds.
        chunkSize: 2048  // in bytes.
      })
      bodyStream.put(reqBody)
      proxyServer.web(req, res, {
        target: req.url,
        buffer: bodyStream,
        ignorePath: true,
        preserveHeaderKeyCase: true,
        selfHandleResponse: false
      })
    })
  }
}

export { createProxyApiMiddleware }
