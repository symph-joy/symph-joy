module.exports = (symphonyConfig = {}) => {
  return Object.assign({}, symphonyConfig, {
    webpack(config, options) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Symphony.js versions below 5.0.0 https://err.sh/symphony-plugins/upgrade'
        )
      }
      config.module.rules.push({
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 5000,
              outputPath: 'static',
              publicPath: '/_symphony/webpack/static'
            }
          }
        ]
      })

      if (typeof symphonyConfig.webpack === 'function') {
        return symphonyConfig.webpack(config, options)
      }

      return config
    }
  })
}
