const withLess = require('@zeit/next-less')
const withImageLoader = require('symphony-image-loader')

module.exports = withImageLoader(withLess({
  cssModules: true,
  webpack(config, options) {
    return config
  }
}));

