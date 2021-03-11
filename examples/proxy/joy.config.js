
module.exports = {
  serverRender: true,
  proxy: {
    enable: true,
    autoProxy: true,
    routes: [{
      type: 'web',
      path: '^/api/',
      target: 'https://news-at.zhihu.com'
    }]
  }
}
