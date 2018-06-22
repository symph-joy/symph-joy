const withCss = require('@symph/joy-css')
const assetPrefix = ''
module.exports = withCss({
  cssModules: false,
  serverRender: false,
  assetPrefix,
  webpack (config, options) {
    const {isServer} = options
    config.module.rules.push({
      test: /\.(eot|svg|ttf|woff|woff2)(\?[^?]*)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            fallback: 'file-loader',
            publicPath: `${assetPrefix}/_symphony/static/images/`,
            outputPath: `${isServer ? '../' : ''}static/images/`,
            name: '[name]-[hash].[ext]'
          }
        }
      ]
    })
    return config
  }
})
