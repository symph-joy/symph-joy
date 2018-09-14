const withCss = require('@symph/joy-css')
const withLess = require('@symph/joy-less')
const path = require('path')
const assetPrefix = ''

module.exports = {
  serverRender: false,
  assetPrefix,
  plugins: [
    // 处理element内部的样式
    withCss({
      cssModules: false,
      ruleOptions: {
        include: [
          path.resolve(__dirname, './node_modules/element-react/'),
          path.resolve(__dirname, './node_modules/element-theme-default/')
        ]
      }
    }),
    // 处理应用内部业务组件的less样式
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
