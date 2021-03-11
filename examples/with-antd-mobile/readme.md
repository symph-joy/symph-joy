
# @symph/joy 集成 antd-mobile


## 注意
[antd-mobile@2.2.5](https://mobile.ant.design/index-cn) 在服务端需要webpack编译后才能启动服务端渲染，而@symph/joy默认在服务端不对`node_modules`中的模块进行编译，所以需要配置`webpack.externals`将`antd-mobile`和其依赖的样式`normalize\.css`标识为需要编译。

```javascript
// joy.config.js
webpack: (webpackConfig, {dir, isServer}) => {
    if (!isServer) {
      return webpackConfig
    }

    const origin =  webpackConfig.externals[0]

    webpackConfig.externals.splice(0, 1, (context, request, callback) => {
      resolve(request, {basedir: dir, preserveSymlinks: true}, (err, res) => {
        if (err) {
          return callback()
        }

        if (res.match(/node_modules[/\\]normalize\.css/) || res.match(/node_modules[/\\]antd-mobile/)) {
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
```

如果使用静态版本部署，或者关闭服务端渲染，则不需要对 `webpack.externals` 进行配置。



