
# 配置文档

默认情况下`@symph/joy`已经提供了从开发到发布所需的默认配置，如需定制功能，请在项目根目录下创建`joy.config.js`配置文件，同`src`和`static`目录同级。

`joy.config.js`它通常使用在`@symph/joy` Server运行时和Build阶段，并不会被导入到浏览器上运行。它是一个常规的Node.js模块，所以要求在其内部使用`module.exports`输出配置对象，并且这里暂时还不能使用ES6等高级语法。

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

设定应用入口组件所在的文件路径，这个大部分开发语言执行Main入口一样，一般会在应用入口的地方，设置应用内路由，以及整个应用的公共模块，。

### distDir

类型：string，默认`.joy`

目标目录是指在编译阶段输出的目标文件夹，你也可以设置自定义的目录名称。

### assetPrefix

类型：string，默认`''`空字符串，即在URL域名的根目录下访问脚本和资源。

如果使用CDN，或者在URL的某个子路径上，你可以设置`assetPrefix`来更改`@symph/joy`应用的访问路径。例如: 下面将生产环境的访问路径设置为`https://cdn.mydomain.com/myapp`， 开发环境访问路径`localhost:3000`

```jsx
const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  assetPrefix: isProd ? 'https://cdn.mydomain.com/myapp' : ''
}
```

> `@symph/joy`会自动将`assetPrefix`引入到加载的scripts和styles的路径上，但`/static`文件夹下的资源除外，你必须自己在路径前面加上`assetprefix`，例如：`<img src='/assetprefix/static/logo.png'/>`；

### serverRuntimeConfig

配置在业务代码中使用的配置信息，`serverRuntimeConfig`定义的配置只能在Node.js Server端读取，

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

### publicRuntimeConfig

请见: [serverRuntimeConfig](#serverRuntimeConfig), `publicRuntimeConfig`中的配置在Server和Client都可读取。

### exportPathMap

类型：async functon, 默认`async () => ({'/': {}})`

在导出应用的静态版本时，该配置定义了需要导出的页面。

```js
// joy.config.js
const withLess = require('@symph/joy-less')

module.exports = {
  exportPathMap: async function () {
    return {
      '/': null,
      '/about.html': {},
      '/learn/getting-started.html': {query: { title: 'getting-started' }},
    }
  }
}
```

对象的`key`是需要渲染的url路径，`query`将作为url的query参数，传递给被渲染的页面。如果url路径是以目录结束，将会被导出为`/dir-name/index.html`文件，如果以文件名结尾，将导出为相同的文件名称，例如上面的`/about.html`。

### plugins

类型：array, 默认`[]`

[查看可用的插件列表](./plugins)

`@symph/joy`提供了插件机制来扩展其能力，例如支持less样式和导入图片等，插件的配置请参考各插件的使用说明文档。插件按照列表定义的顺序依次执行。


```js
const withLess = require('@symph/joy-less')
const withImageLoader = require('@symph/joy-image')

module.exports = {
  serverRender: true,
  plugins: [
    withLess({cssModules: true}),
    withImageLoader({limit: 8192})
  ]
}
```


### webpack 

类型：function

一些常用的功能，`@symph/joy`提供了插件来支持，请先查看[插件列表](#plugins)是否有你想要额外功能。你也可以定义函数来增加或修改webpack的配置。

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

注意：`webpack`函数会被执行两次，分别是为了编译出在服务端和客户端运行的代码，你可以通过`isServer`入参来区分。

## 自定义 Babel config

为了扩展`babel`的配置，可以在应用的根目录下创建`.babelrc`的文件，这个文件是可选的，如果它存在，就必须包含`@symph/joy/babel` preset，这样joy才能正常运行。

下面是一个`.babelrc`的例子：

```json
{
  "presets": ["@symph/joy/babel"],
  "plugins": []
}
```

`@symph/joy/babel` 里包含了编译应用的所需的所有配置，比如：

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
    ["@symph/joy/babel", {
      "preset-env": {},
      "transform-runtime": {},
      "styled-jsx": {}
    }]
  ],
  "plugins": []
}
```

注意：`preset-env`里的`modules`配置项必须保持为`false`，否则webpack的代码分离功能将不可以用。
