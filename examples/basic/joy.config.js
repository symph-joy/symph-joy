const withLess = require('@symph/joy-less')
const withImageLoader = require('@symph/joy-image')

module.exports = withImageLoader(withLess({
  serverRender: true,
  cssModules: true,
  exportPathMap: async function (defaultPathMap) {
    return {
      '/': { page: '/', query: { title: 'basic example' } },
    }
  },
  webpack (config, options) {
    return config
  }
}))
