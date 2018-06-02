const withLess = require('@zeit/next-less')
const withImageLoader = require('next-images')

module.exports = withImageLoader(withLess({
  cssModules: true,
  webpack (config, options) {
    return config
  }
}))
