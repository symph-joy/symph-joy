const env = process.env.NODE_ENV
const isProduction = env === 'production'
const isDevelopment = env === 'development'
const isTest = env === 'test'

// Resolve styled-jsx plugins
function styledJsxOptions (opts) {
  if (!opts) {
    return {}
  }

  if (!Array.isArray(opts.plugins)) {
    return opts
  }

  opts.plugins = opts.plugins.map(plugin => {
    if (Array.isArray(plugin)) {
      const [name, options] = plugin
      return [
        require.resolve(name),
        options
      ]
    }

    return require.resolve(plugin)
  })

  return opts
}

module.exports = (context, opts = {}) => ({
  presets: [
    [require('@babel/preset-env').default, {
      // In the test environment `modules` is often needed to be set to true, babel figures that out by itself using the `'auto'` option
      // In production/development this option is set to `false` so that webpack can handle import/export with tree-shaking
      modules: isDevelopment || isProduction ? false : 'auto',
      ...opts['preset-env']
    }],
    [require('@babel/preset-react'), {
      // This adds @babel/plugin-transform-react-jsx-source and
      // @babel/plugin-transform-react-jsx-self automatically in development
      development: isDevelopment || isTest,
      ...opts['preset-react']
    }],
    [require('@babel/preset-typescript'), { isTSX: true, allExtensions: true }]
  ],
  plugins: [
    [require('./plugins/joy-autowire-label-plugin'), { autoBinding: false }],
    require('babel-plugin-react-require'),
    require('@babel/plugin-syntax-dynamic-import'),
    isDevelopment && require('react-hot-loader/babel'),
    require('./plugins/react-loadable-plugin'),
    [require('@babel/plugin-proposal-decorators'), { decoratorsBeforeExport: true }],
    [require('@babel/plugin-proposal-class-properties')],
    require('@babel/plugin-proposal-object-rest-spread'),
    [require('@babel/plugin-transform-runtime'), {
      helpers: false,
      regenerator: true,
      ...opts['transform-runtime']
    }],
    [require('styled-jsx/babel'), styledJsxOptions(opts['styled-jsx'])]
    // 暂时屏蔽该插件(版本：v0.4.21)，会导致编译错误 （Duplicate declaration "React"） 2018年12月18日
    // isProduction && require('babel-plugin-transform-react-remove-prop-types')
  ].filter(Boolean)
})
