const resolve = require('resolve')
const withCss = require('@symph/joy-css')
const withLess = require('@symph/joy-less')
const path = require('path')

module.exports = {
  serverRender: true,
  plugins: [
    // 处理antd-mobile中的样式
    withCss({
      cssModules: false,
      ruleOptions: {
        include: [
          path.resolve(__dirname, './node_modules/')
        ]
      },
    }),
    withLess({
      cssModules: false,
      ruleOptions: {
        include: [
          path.resolve(__dirname, './node_modules/')
        ]
      }
    }),
    // 处理应用内组件的less样式
    withLess({
      cssModules: true,
      ruleOptions: {
        exclude: [
          path.resolve(__dirname, './node_modules/')
        ]
      }
    }),
  ],
  webpack: (webpackConfig, {dir, isServer}) => {
    // 由于antd-mobile不进行编译的话，无法进行服务端渲染，所以这里需要特殊处理下
    // 如果配置 serverRender: false 关闭服务渲染的话，可以不需要这部分
    if (!isServer) {
      return webpackConfig
    }

    const origin =  webpackConfig.externals[0]

    webpackConfig.externals.splice(0, 1, (context, request, callback) => {
      resolve(request, {basedir: dir, preserveSymlinks: true}, (err, res) => {
        if (err) {
          return callback()
        }

        if (res.match(/node_modules[/\\]normalize\.css/) || res.match(/node_modules[/\\]antd/)) {
          return callback()
        }

        if(origin){
          origin(context, request, callback)
        } else {
          callback()
        }
      })
    })

    return webpackConfig
  }
}

