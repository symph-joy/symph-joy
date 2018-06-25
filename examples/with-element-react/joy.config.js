const withCss = require('@symph/joy-css')
const withLess = require('@symph/joy-less')
const assetPrefix = ''
module.exports = {
  // cssModules: false,
  serverRender: false,
  assetPrefix,
  plugins: [
    withCss({
      cssModules: false
    }),
    withLess({
      cssModules: true
    })
  ],
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
}
