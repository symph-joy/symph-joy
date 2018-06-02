# `@symph/joy`

@symph/joy 的目标是简单易用的React SPA应用，灵感来自于Next.js和Dva等优秀的开源库，在此诚挚感谢以上开源贡献者的辛勤付出。

## 特征
 
- 零配置生成可用的工程，自动生成浏览器和服务端端代码。（使用webpack和babel）
- 服务端数据获取和渲染， 解决首屏加载速度、页面静态化、SEO等问题
- 代码热加载，便于开发调试
- 按需加载，提升页面加载效率
- 使用Model类管理redux的action、state、reducer部件，代码结构和业务逻辑更清晰
- 在redux的基础上，简化概念和代码，更专注于业务实现。
- 支持插件化配置。


## 安装和第一个页面

运行`npm init`创建一个空工程，并填写项目的基本信息，当然也可以在一个已有的项目中直接安装。

```bash
npm install --save @symph/joy react react-dom
```
> @symph/joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html).<br/>

创建`./src/index.js`文件，并插入以下代码：

```jsx
import React, {Component} from 'react'

export default class Index extends Component{
  render(){
    return <div>Welcome to symphony joy!</div>
  }
}
```

然后运行`joy` 命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `joy dev -p <your port here>`

到目前为止，一个简单完整的react app已经创建完成，例子[hello-world](./examples/hello)，到这儿我们拥有了什么功能呢？

- 一个应用入口（`./src/index.js`），我们可以在里面完善我们的app内容和添加路由（参考[react-router-4](https://reacttraining.com/react-router/web/guides/philosophy)的使用方法）
- 启动了一个开发服务器，可以渲染我们编写的界面了
- 一个零配置的webpack编译器，监控我们的源码，确保在浏览器和node端正常运行
- ES6等高级语法支持，不用担心node端不兼容的语法
- 热加载，如果我们修改了`./src/index.js`的内容并保存，界面会自动刷新
- 静态资源服务，在`/static/`目录下的静态资源，可通过`http://localhost:3000/static/`访问


## 样式 CSS

### jsx内建样式

和next.js一样，内建了 [styled-jsx](https://github.com/zeit/styled-jsx) 模块，支持Component内独立域的CSS样式，不会和组件外同名样式冲突。

```jsx
export default () =>
  <div>
    Hello world
    <p>scoped!</p>
    <style jsx>{`
      p {
        color: blue;
      }
      div {
        background: red;
      }
      @media (max-width: 600px) {
        div {
          background: blue;
        }
      }
    `}</style>
    <style global jsx>{`
      body {
        background: black;
      }
    `}</style>
  </div>
```

查看  [styled-jsx 文档](https://www.npmjs.com/package/styled-jsx) ，获取详细信息。


### Import CSS / LESS / SASS 文件

为了支持导入css、less和sass样式文件，可使用样式插件，具体使用方法请见插件详情页面。

- [@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)
- [@symph/joy-less](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-less)
- [@symph/joy-image](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)


## 访问静态文件

在工程根目录下创建`static`目录，将需要待访问的文件放入其中，也可以在里面创建子目录管理这些文件，可以通过`<assetPrefix>/static/<file>`路径访问这些文件。

```jsx
export default () => <img src="/static/my-image.png" />
```

## 自定义 Head

@symph/joy 提供了`Head` Component来设置html页面的`<head>`中的内容

```jsx
import Head from '@symph/joy/head'

export default () =>
  <div>
    <Head>
      <title>My page title</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <p>Hello world!</p>
  </div>
```

为了避免在`head`中重复添加多个相同标签，可以给标签添加`key`属性， 相同的key只会渲染一次。

```jsx
import Head from '@symph/joy/head'
export default () => (
  <div>
    <Head>
      <title>My page title</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
    </Head>
    <Head>
      <meta name="viewport" content="initial-scale=1.2, width=device-width" key="viewport" />
    </Head>
    <p>Hello world!</p>
  </div>
)
```

在上面的例子中，只有第二个`<meta name="viewport" />`被渲染和添加到页面。

## 获取数据

`@symph/joy/fetch`发送数据请求， 其调用参数和浏览器提供的[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)方法保持一致。

```jsx
import fetch from '@symph/joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET'})
  .then(respone = >{
      // do something...
  });
```

`@symph/joy/fetch` 提供简单的跨域解决方案，跨域请求会先转发到node服务端，node服务器作为代理服务器，完成真实的数据请求，并且响应数据回传给浏览器。

TODO 插入流程图

如果想关闭改内建行为，使用jsonp来完成跨域请求，可以在fetch的options参数上设定`options.mode='cors'`

```jsx
import fetch from '@symph/joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET', mode:'cors})
  .then(respone = >{
      // do something...
  });
```

> 也可以使用其它的类似解决方案，例如：[node-http-proxy](https://github.com/nodejitsu/node-http-proxy#using-https)、[express-http-proxy](https://github.com/villadora/express-http-proxy)等。我们内建了这个服务，是为了让开发人员像原生端开发人员一样，更专注于业务开发，不再为跨域、代理路径、代理服务配置等问题困扰。

如果使用`joy`或`joy-start`来启动应用，不需要任何配置，即可使用跨域服务。如果项目采用了自定义Server，需要开发者将`@symph/joy/proxy-api-middleware`代理服务注册到自定义的Server中。

```jsx
const express = require('express')
const symph = require('@symph/joy')
const {createProxyApiMiddleware} = require('@symph/joy/proxy-api-middleware')

const app = symph({ dev })
const handle = app.getRequestHandler()

app.prepare()
.then(() => {
  const server = express()
  server.use(createProxyApiMiddleware())  //register proxy, 
  server.get('*', (req, res) => {
    return handle(req, res)
  })
})
```

`createProxyApiMiddleware(options)`和`fetch(url, options)`方法的`options`参数对象中可以使用`proxyPrefix`参数，用于设置proxy的url路径前缀，当应用不是部署在url根路径下时，这非常有用。

## 应用组件

<!-- 由于javascript语言的开放性，在实际的开发工作中，不同的团队和开发人员，所编写的应用在结构和代码风格上往往存在较大的差异，这给迭代维护和多人协同开发带来了麻烦，   同时为了让开发人员更专注于业务开发，@symph/joy提供了以下应用层组件，来提高开发效率。 -->

![app work flow](https://github.com/lnlfps/static/blob/master/symphony-joy/images/app-work-flow.jpeg?raw=true)

图中蓝色的箭头表示数据流的方向，红色箭头表示控制流的方向，在内部使用redux来实现整个流程，为了更好的推进工程化以及简化redux的实现，我们抽象了出了Controller和Model两个类，从上图中可以看到，我们的业务都是通过这两个类协同工作实现的，它们只是包含业务方法和生命周期的简单类。

>为了更好的理解以下内容，可先阅读以下相关知识：[redux](https://github.com/reactjs/redux)， [dva concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts.md)

### Model

正如我们所知，在任何场合都要求视图和业务分离，Model就是完全负责业务处理的，在@symph/joy里，我们不应该把业务相关的代码放到Model以外的地方，同时Model也是存放业务数据的地方，我们应该保证同一个数据，在应用中只应唯一的存在一处，这样的数据才可控。

Model拥有初始状态`initState`和更新状态的方法`setState(nextState)`，这和Component的state概念类似，在业务方法(也被叫做effects方法)执行过程中，更新Model中的`state`，这里并没有什么魔法和创造新的东西，只是将redux的`action`、`actionCreator`、`reducer`,`thunk`等复杂概率抽象成业务状态和流程，从而方便代码管理，开发时也更专注于业务.

下面是一个简单的model示例：

```jsx
import model from '@symph/joy/model'

@model()
export default class ProductsModel {

  // the mount point of store state tree, must unique in the app.
  namespace = 'products';

  // model has own state， this is the initial state
  initState = {
    pageIndex: null,
    pageSize: 5,
    products: [],
  };

  async getProducts({pageIndex = 1, pageSize}) {
    // fetch data
    let data = await new Promise((resolve, reject) => {
      setTimeout(() => {
        let resultData = [];
        for (let i = (pageIndex - 1) * pageSize; i < pageIndex * pageSize; i++) {
          resultData.push({
            id: i,
            name: 'iphone 7',
            price: 4999,
          })
        }
        resolve(resultData)
      }, 200);
    });

    let {products} = this.getState();
    if (pageIndex === 1) {
      products = data;
    } else {
      products = [...products, ...data];
    }

    this.setState({
      products,
      pageIndex,
      pageSize
    });
  }

};

```

我们使用`@model()`将一个类声明为Model类，Model类在实例化的时候会添加`getState`、`setState`，`dispatch`等快捷方法。

#### Model API

##### namespace

model将会被注册到store中，由store统一管理model的状态，使用`store.getState()[namespace]`来访问对应model的state, store中不能存在两个相同的`namespace`的model。

##### initState

设置model的初始化状态，由于`model.state`可能会被多个`async`业务方法同时操作，所以为了保证state的有效性，请在需要使用state时使用`setState(nextState)`来获取当前state的最新值，并使用`getState()`方法更新当前的state。

##### setState(nextState)

`setState(nextState)`更新model的状态，`nextState`是当前state的一个子集，系统将使用浅拷贝的方式合并当前的状态，并更新store的state。

##### getState()

`getState()`获取当前model的状态。

##### getStoreState()

`getStoreState(）`获取当前整个store的状。

##### dispatch(action)

和redux的`store.dispatch(action)`的使用一样，由系统分发`action`到指定的model业务方法中, `action.type`的格式为`modelNamespace/customServiceMethod`。

为了方便调用model中的其它业务方法，可直接使用`await this.effect(action)`的方式调用。

##### async effects(action)

我们将实现具体业务功能的函数，称之为effect方法。在controller或者其他model中通过`dispatch(action)`方法调用这类方法，effect方法是`async`函数，在里面可以使用`await`来编排业务逻辑，并返回Promise对象作为`dispatch`的返回值，所以可以在业务调用方，通过检测Promise来获得effect执行的结果。

#### Dva Model

我们同时兼容dva风格的model对象，使用方法和上面一样，model对象的定义请参考 [Dva Concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts_zh-CN.md) ;


### Controller

Controller的作用是连接View和Model组件，并新增了`async componentPrepare()`生命周期方法，该方法是一个异步函数，在服务端渲染时，会等待该方法执行完成后，才会渲染出界面，浏览器会直接使用在服务端获取到的数据来渲染界面，不再重复执行`componentPrepare`方法。如果没有启动服务端渲染，或者是在浏览器上动态加载该组件时，该方法将在客户端上自动运行。

```jsx
import React, {Component} from 'react';
import ProductsModel from '../models/ProductsModel'
import controller, {requireModel} from 'symphony-joy/controller'


@requireModel(ProductsModel)          // register model
@controller((state) => {              // state is store's state
  return {
    products: state.products.products // bind model's state to props
  }
})
export default class IndexController extends Component {

  async componentPrepare() {
    let {dispatch} = this.props;
    // call model's effect method
    await dispatch({
      type: 'products/getProducts', 
      pageIndex: 1,
      pageSize: 5,
    });
  }

  render() {
    let {products = []} = this.props;
    return (
      <div >
        <div>Product List</div>
        <div>
          {products.map((product, i) => {
            return <div key={product.id} onClick={this.onClickProduct.bind(product)}>{product.id}:{product.name}</div>
          })}
        </div>
      </div>
    );
  }
}

```

创建和使用Controller的步骤：

- 使用`@controller(mapStateToProps)`装饰器将一个普通的Component声明为一个Controller，`mapStateToProps`参数实现model状态和组件props属性绑定，当model的state发生改变时，同时会触发组件props的改变并重新渲染界面。

- 使用`@requireModel(ModelClass)`注册Controller需要依赖的Model，在浏览器端页面可能是按需加载的，所以通常只需要第一个使用到Model的Controller上注册一次就可以了，重复注册无效，但也会出任何问题。

- 每个controller的`props`都会被注入一个redux的`dispatch`方法，`dispatch`方法是controller给model发送action的唯一途径，View通过这唯一的途径调用model上的业务方法。


### Router

使用方法请参考：[react-router-4](https://reacttraining.com/react-router/web/example/basic)

 > 我们并未对react-router-4做任何的修改，仅仅只是封装了一个外壳，方便统一调用。
 
导入路径

 ```jsx
 import {Switch, Route} from '@symph/joy/router'
 ```

 ### 自定义`<Document>`

- 服务端渲染时，使用该组件生成静态的html文档

- 如果需要在后html文件引入额外的`<script>`或`<lint>`标签，需要自定义<Document>，例如在使用[@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)插件时，需要引入`"/_symphony/static/style.css`样式文件。

在`@symph/joy`中，`<Main>`组件(默认存放路径：`src/index.js`)中只需包含功能代码，不能包含document标签中的`<head>`和`<body>`部分，这样设计目的是让开发从一开始就专注于业务。`<Main>`以外的部分，并不会在浏览器端初始化，所以不能在这里放置任何的业务代码，如果希望在整个应用里共享一部分功能，请将它们放到`<Main>`中。

```jsx
import Document, { Head, Main, SymphonyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html>
        <Head>
          {/* add custom style file */}
          <link rel='stylesheet' href='/_symphony/static/style.css' />
        </Head>
        <body>
          <Main />
          <SymphonyScript />
        </body>
      </html>
    )
  }
}
```

### 自定义Configuration

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

#### Configuration Items

##### main： string

默认`src/index.js`

设定应用入口组件所在的文件路径，需要使用`export default`导出Main组件，一般会在这里设置整个应用的公共模块，以及路由定义。

##### distDir： string

默认`.joy`

编辑目录是指在编译阶段输出的目标文件夹，你也可以设置自定义的目录名称。

##### assetPrefix： string

默认`''`空字符串，即通过`/`访问应用内的脚本和资源。

如果使用CDN，或者访问路径某个子路径上，你可以设置`assetPrefix`来更改`@symph/joy`访问路径。例如: 下面将生产环境的访问路径设置为`https://cdn.mydomain.com/myapp`， 开发环境访问路径`localhost:3000/myapp`

```jsx
const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  assetPrefix: isProd ? 'https://cdn.mydomain.com/myapp' : '/myapp'
}
```

> `@symph/joy`会自动将`assetPrefix`引入到加载的scripts和styles的路径上，但`/static`路径下的资源除外，你必须自己在代码里写入prfix，例如：`<img src='/assetprefix/static/logo.png'/>`；

##### webpack: function 

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

### 自定义Babel config

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

#### 为Server和Client端配置运行时环境变量

配置的所有项都可以在运行时读取，`serverRuntimeConfig`里的配置只能在Server端读取，`publicRuntimeConfig`在Server和Client都可读取。

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

```jsx
// src/index.js
import getConfig from '2symph/joy/config'
// Only holds serverRuntimeConfig and publicRuntimeConfig from joy.config.js nothing else.
const {serverRuntimeConfig, publicRuntimeConfig} = getConfig()

console.log(serverRuntimeConfig.mySecret) // Will only be available on the server side
console.log(publicRuntimeConfig.staticFolder) // Will be available on both server and client

export default () => <div>
  <img src={`${publicRuntimeConfig.staticFolder}/logo.png`} alt="logo" />
</div>
```


## TODO

- 完善使用文档
- 添加例子和测试案例

