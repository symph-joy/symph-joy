import httpProxy from 'http-proxy'
// import modifyResponse from 'node-http-proxy-json'
import url from 'url'

const Log = console

const HTTP_HEADER_PROXY_TARGET = 'x-proxy-target'

const defaultProxyConfig = {
  /**
   * 定义该代理点能处理的客户端请求路径，支持正则字符串，最终由RegExp生成正则表达式，和`request.path`进行匹配。
   */
  path: null,

  /**
   * 代理的目标服务器，一般为提供服务的业务服务器地址。例如：http://service.com/api/v1
   */
  target: null,

  // ws(websocket)或者web
  type: 'web',

  // 添加 x-forwarded-xxx 头
  xfwd: true,

  // 是否验证SSL证书
  secure: false,

  // Object，将会被传入https.createServer()中
  ssl: null,

  // 是否忽略客户端请求的path部分，如果为true，则代理服务器发送请求到目标服务器上时，将不会包含原始请求的path部分。
  ignorePath: false,

  /**
   * 重写客户端请求路径，可能的值:
   * Object, 但在对应关系替换，只替换第一次匹配到的路径。例如：
   * {
   *   "/old_path/": "/new_path/",  // 替换为新的path
   *   "/path/": "/",               // 删除path
   *   "/": "/path/"             // 在路径前面添加新的path
   * }
   */
  pathRewrite: null,

  // 将target定义path部分，添加到客户端请求path的前面。
  prependPath: true,

  localAddress: undefined,

  // 改变客户端请求header中的host值，如果为false，客户端在发送请求时，必须确保header中设置正确目标的host，否则浏览器默认添加为代理服务器的host地址，这可能导致最终请求失败
  changeOrigin: true,

  // 设置是否需要保持客户端请求header字段名称的大小写，默认会将header中的字段转换为全小写。
  preserveHeaderKeyCase: true,

  // Basic authentication i.e. 'user:password' to compute an Authorization header.
  auth: null,

  // 当 (201/301/302/307/308) 时，使用该值重写业务服务器响应headers["location"]里的hostname。
  hostRewrite: null,

  // 当 (201/301/302/307/308) 时，基于客户端的原始请求，自动重写业务服务器响应headers["location"]里的host/port
  autoRewrite: false,

  // 当 (201/301/302/307/308) 时， 使用该值重写业务服务器响应headers["location"]里的协议部分，例如：http或者https
  protocolRewrite: null,

  /**
   * 重写'set-cookie'头中的domain，可能的值
   * bool, 默认false， 关闭cookie重写， TODO 支持true选项，代表auto选项，自动根据原始请求设置该值
   * string，新的domain，例如：`cookieDomainRewrite: "new.domain"`。如果需要删除domain，使用`cookieDomainRewrite: ""`
   * Object, 按照对应关系替换，使用`"*"`匹配所有的domain，例如：
   * cookieDomainRewrite: {
   *   "unchanged.domain": "unchanged.domain", //保存不变
   *   "old.domain": "new.domain",  // 替换为新的domain
   *   "*": ""  // 删除其它的domain
   * }
   *
   */
  cookieDomainRewrite: false,

  /**
   * 重写'set-cookie'头中的路径，可能的值
   * bool, 默认false， 关闭cookie重写，
   * string，新的path，例如：`cookiePathRewrite: "/newPath/"`。删除path `cookiePathRewrite: ""`，设置为根路径`cookiePathRewrite: "/"`
   * Object, 按照对应关系替换，使用`"*"`匹配所有的path，例如：
   * cookiePathRewrite: {
   *   "/unchanged_path/": "/unchanged_path/", //保存不变
   *   "/old_path/": "/new_path/",  // 替换为新的path
   *   "*": ""  // 删除其它的path
   * }
   *
   */
  cookiePathRewrite: false,

  // 设置额外的请求头到目标请求上。
  headers: null,
  // outgoing请求socket超时时间，单位毫秒。
  proxyTimeout: 0,
  // incoming 请求的超时时间，单位毫秒。
  timeout: 0,
  // outgoing请求，和目标服务器通信是自动处理重定向。
  followRedirects: false,

  //= == event
  /**
   *  当发生异常时触发该事件。代理内部不会处理任何的异常信息，包括客户端和代理之间通信时发现的异常，以及代理和目标服务器通信时发现的异常，所以我们建议由你来监听和处理异常。
   *  (err, req, res) => {},
   */
  onError: null,
  /**
   * 代理向目标服务器发送数据之前触发该事件，可以在这里修改proxyReq请求对象。适用于web类型的连接。
   * (proxyReq, req, res) => {}
   */
  onProxyReq: null,
  /**
   * 代理向目标服务器发送数据之前触发该事件，可以在这里修改proxyReq请求对象。适用于websocket类型的连接。
   * (proxyReq, req, res) => {}
   */
  onProxyReqWs: null,

  /**
   * 当从目标服务器得到响应时触发，可以在这里得到响应的数据，对数据进行编辑，然后输出给客户端。
   * (proxyRes, req, res) => {}
   */
  onProxyRes: null,
  /**
   * 当代理的websocket创建完成，并且和目标服务器的websocket建立管道连接时触发一次。
   * (proxySocket) => {}
   */
  onOpen: null,

  /**
   * 当代理的websocket关闭时触发一次。
   * (res, socket, head) => {}
   */
  onClose: null
}

const autoProxyDefaultConfig = {
  type: 'web',
  path: '^/__proxy/',
  target: 'from-header',
  pathRewrite: {
    '/__proxy/': '/'
  }
}

function createProxyMiddleware (proxyConfig) {
  if (!proxyConfig || !proxyConfig.enable) {
    // 不需要代理
    return null
  }

  let { dev, autoProxy, routes } = proxyConfig
  routes = [...(routes || [])]
  if (autoProxy === undefined || autoProxy === null) {
    autoProxy = process.env.NODE_ENV === 'development'
  }
  let autoProxyServerConfig = null
  if (typeof autoProxy === 'boolean') {
    autoProxyServerConfig = Object.assign({}, autoProxyDefaultConfig)
  } else if (typeof autoProxy === 'object') {
    autoProxyServerConfig = Object.assign({}, autoProxyDefaultConfig, autoProxy)
  }
  if (autoProxyServerConfig) {
    routes.push(autoProxyServerConfig)
  }
  if (!routes || routes.length === 0) {
    // 不需要代理
    return null
  }

  const incomingRequestHandlers = []
  for (let i = 0; i < routes.length; i++) {
    let route = routes[i]
    route = Object.assign({}, defaultProxyConfig, route)
    let handler = createProxyServer(route, dev)
    if (handler) {
      incomingRequestHandlers.push(handler)
    }
  }

  return async function proxy (req, res, next) {
    if (incomingRequestHandlers.length === 0) {
      if (next && (typeof next === 'function')) next()
      return false
    }
    for (let i = 0; i < incomingRequestHandlers.length; i++) {
      const handler = incomingRequestHandlers[i]
      if (await handler(req, res, next)) {
        return true
      }
    }
    if (next && (typeof next === 'function')) next()

    return false
  }
}

function createProxyServer (route, dev) {
  let { type, path, target, pathRewrite, ignorePath, ...proxyServerConfig } = route
  let { onProxyReq, onProxyRes, onError } = route

  let pathRegExp
  if (path instanceof RegExp) {
    pathRegExp = path
  } else {
    pathRegExp = new RegExp(path)
  }

  let proxyServer = httpProxy.createProxyServer({ ...proxyServerConfig, ignorePath: true })

  const notifyOnError = (err, req, res) => {
    if (onError && (typeof onError === 'function')) {
      onError(err, req, res)
    }
    if (dev) {
      Log.log(`proxy onError, method:${req.method}, url:${req.url}, status:${(res && res.statusCode) || '--'}}`)
    }
  }

  proxyServer.on('proxyReq', function (proxyReq, req, res, options) {
    if (onProxyReq && (typeof onProxyReq === 'function')) {
      onProxyReq(proxyReq, req, res, options)
    }
    if (dev) {
      Log.log(`proxy onReq, method:${req.method}, url:${req.url}, body:${req.body || ''}`)
    }
  })

  proxyServer.on('proxyRes', function (proxyRes, req, res) {
    if (onProxyRes && (typeof onProxyRes === 'function')) {
      onProxyRes(proxyRes, req, res)
    }
    // get response body as json object
    // modifyResponse(res, proxyRes, function (body) {
    //   if (onProxyResBody && (typeof onProxyResBody === 'function')) {
    //     body = onProxyResBody(proxyRes, req, res, body) || body
    //   }
    //   if (dev) {
    //     Log.log(`proxy onRes, method:${req.method}, url:${req.url}, status:${res.statusCode}, body:${JSON.stringify(body)}`)
    //   }
    //   return body
    // })
  })

  proxyServer.on('error', function (err, req, res) {
    notifyOnError(err, req, res)
  })

  /**
   * 返回true,表示请求已经被接受并处理。
   */
  return async function proxy (req, res, next) {
    const incomingReqUrl = url.parse(req.url)
    let match = pathRegExp.exec(incomingReqUrl.path)
    if (!match) {
      if (next && (typeof next === 'function')) {
        next()
      }
      return false
    }

    if (target === 'from-header') {
      // 没有设定target路径，则使用客户端在x-proxy-target中过去目标url，由客户端来指定模板地址，
      // 但这样将会把后端的服务器暴露出来，且代理请求的范围无法控制，存在很大的风险，在生产环境不建议启动该功能
      target = req.headers[HTTP_HEADER_PROXY_TARGET]
      if (!target) {
        responseError(req, res, 400, `${HTTP_HEADER_PROXY_TARGET} header is required`)
        return true
      }
    }
    let outgoingPath
    if (ignorePath) {
      outgoingPath = ''
    } else {
      outgoingPath = ignorePath ? '' : incomingReqUrl.path
      if (pathRewrite && Object.keys(pathRewrite).length > 0) {
        Object.keys(pathRewrite).forEach((path) => {
          outgoingPath = outgoingPath.replace(path, pathRewrite[path])
        })
      }
    }
    let targetUrl = `${target}${outgoingPath}`

    proxyServer.web(req, res, {
      target: targetUrl
    })
    return true
  }
}

function responseError (req, res, status, message) {
  res.status = status
  res.write(message)
  res.end()
}

export { createProxyMiddleware }
