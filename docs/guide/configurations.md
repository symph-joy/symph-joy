
# Configuration

默认情况下`@symph/joy`已经提供了从开发到发布所需的默认配置，如需定制高级功能，请在项目根目录下创建`joy.config.js`配置文件，同`src`和`static`目录同级。

`joy.config.js`它通常使用在`@symph/joy` Server运行时和Build阶段，并不会被导入到浏览器上运行。它是一个常规的Node.js module，且会被直接加载运行，所以要求使用`module.exports`输出配置对象，并且这里暂时还不能使用ES6等高级语法。

```jsx
// joy.config.js
module.exports = {
  /* config options here */
  main: 'src/index.js',
  distDir: '.joy',
  assetPrefix: '',
  webpack: null,
}
```
或者使用函数

```jsx
// joy.config.js

module.exports = (phase, {defaultConfig}) => {
  return {
    /* config options here */
  }
}
```

`phase`是加载当前配置文件的上下文，你可以在[`constants`](https://github.com/lnlfps/symph-joy/blob/master/lib/constants.js)中查看所以的枚举值，使用时请从`@symph/joy/constants`中导入。

```jsx
const {PHASE_DEVELOPMENT_SERVER} = require('@symph/joy/constants')
module.exports = (phase, {defaultConfig}) => {
  if(phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      /* development only config options here */
    }
  }

  return {
    /* config options for all phases except development here */
  }
}
```

## 配置选项

### main

类型：string，默认`src/index.js`

设定应用入口组件所在的文件路径，需要使用`export default`导出Main组件，一般会在这里设置整个应用的公共模块，以及路由定义。

### distDir

类型：string，默认`.joy`

编辑目录是指在编译阶段输出的目标文件夹，你也可以设置自定义的目录名称。

### assetPrefix

类型：string，默认`''`空字符串，即在域名的根目录下访问脚本和资源。

如果使用CDN，或者访问路径某个子路径上，你可以设置`assetPrefix`来更改`@symph/joy`访问路径。例如: 下面将生产环境的访问路径设置为`https://cdn.mydomain.com/myapp`， 开发环境访问路径`localhost:3000/myapp`

```jsx
const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  assetPrefix: isProd ? 'https://cdn.mydomain.com/myapp' : '/myapp'
}
```

> `@symph/joy`会自动将`assetPrefix`引入到加载的scripts和styles的路径上，但`/static`路径下的资源除外，你必须自己在代码里写入prfix，例如：`<img src='/assetprefix/static/logo.png'/>`；

### publicRuntimeConfig

请见: [serverRuntimeConfig](#serverRuntimeConfig)

### serverRuntimeConfig

配置的业务代码中使用的配置数据，`serverRuntimeConfig`定义的配置只能在Server端读取，`publicRuntimeConfig`在Server和Client都可读取。

```jsx
// joy.config.js
module.exports = {
  serverRuntimeConfig: { // Will only be available on the server side
    mySecret: 'secret'
  },
  publicRuntimeConfig: { // Will be available on both server and client
    staticFolder: '/static'
  }
}
```

在业务代码中读取配置

```jsx
// src/index.js
import getConfig from '@symph/joy/config'
// Only holds serverRuntimeConfig and publicRuntimeConfig from joy.config.js nothing else.
const {serverRuntimeConfig, publicRuntimeConfig} = getConfig()

console.log(serverRuntimeConfig.mySecret) // Will only be available on the server side
console.log(publicRuntimeConfig.staticFolder) // Will be available on both server and client

export default () => <div>
  <img src={`${publicRuntimeConfig.staticFolder}/logo.png`} alt="logo" />
</div>
```

### webpack 

类型：function

为了扩展webpack的能力，你可以定义函数来增加webpack的配置，或者修改以后的配置。

```jsx
// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Perform customizations to webpack config

    // Important: return the modified config
    return config
  },
  webpackDevMiddleware: config => {
    // Perform customizations to webpack dev middleware config

    // Important: return the modified config
    return config
  }
}
```

注意：`webpack`函数会被执行两次，一次是为编译服务端运行的代码，另一次是为了编译在客户端上运行的代码，可以通过`isServer`入参来区分。

一些常用的功能配置已经封装为配置插件，可以直接使用，比如：

- [@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)
- [@symph/joy-less](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-less)
- [@symph/joy-image](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)

多个模块配置可以使用函数组合调用实现，例如：

```jsx
const withImage = require('@zeit/next-image')
const withLess = require('@symph/joy/joy-less')

module.exports = withLess(withImage({
  webpack(config, options) {
    // Further custom configuration here
    return config
  }
}))
```

## 自定义 Babel config

为了扩展`babel`的配置，可以在应用的根目录下创建`.babelrc`的文件，这个文件是可选的，如果它存在，就必须包含`@symph/joy/babel`preset里预定义的，提供joy正常运行的配置。

下面是一个`.babelrc`的例子：

```json
{
  "presets": ["@symph/joy/babel"],
  "plugins": []
}
```

`@symph/joy/babel` 里包含了编译React应用的所有配置，比如：

- preset-env
- preset-react
- plugin-proposal-class-properties
- plugin-proposal-object-rest-spread
- plugin-transform-runtime
- styled-jsx

上面这些已有的preset和plugin不能再添加到自定义的`.babelrc`中，你可以直接在`@symph/joy/babel` preset的基础上修改,比如：

```json
{
  "presets": [
    ["next/babel", {
      "preset-env": {},
      "transform-runtime": {},
      "styled-jsx": {}
    }]
  ],
  "plugins": []
}
```

注意：`preset-env`里的`modules`配置项必须保持其值为`false`，否则webpack的代码分离功能将不可以用。
