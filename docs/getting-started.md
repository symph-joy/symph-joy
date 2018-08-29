
# 使用指南

## 安装和开始

运行`yarn init`创建一个空工程，填写项目的基本信息，当然也可以在一个已有的项目中安装使用。

```bash
yarn install --save @symph/joy react react-dom
```
> @symph/joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html)及以上版本

添加NPM脚本到package.json文件：

```json
{
  "scripts": {
    "dev": "joy"
  }
}
```

创建`./src/index.js`文件，并插入以下代码：

```jsx
import React, {Component} from 'react'

export default class Index extends Component{
  render(){
    return <div>Welcome to symphony joy!</div>
  }
}
```

然后运行`yarn run dev` 命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `yarn** run dev -- -p <your port here>`

到目前为止，一个简单完整的react app已经创建完成，例子[hello-world](https://github.com/lnlfps/symph-joy/tree/master/examples/hello-world)，到这儿我们拥有了什么功能呢？

- 一个应用入口（`./src/index.js`），这里通常会包含界面路由([react-router-4](https://reacttraining.com/react-router/web/guides/philosophy))和模块初始化等。
- 启动了一个开发服务器，可以渲染界面和转发请求
- 一个零配置的webpack编译器，监控我们的代码变动，时时输出到浏览器和Node.js
- ES6 7 8 等高级语法支持，同时兼容浏览器端和Node.js
- 热加载，如果我们修改了`./src/index.js`的内容，界面会自动刷新
- 静态资源服务，在`/static/`目录下的静态资源，可通过`http://localhost:3000/static/`访问


## 样式 CSS

### jsx内建样式

和next.js一样，内建了 [styled-jsx](https://github.com/zeit/styled-jsx) 模块，支持Component内独立域的CSS样式，不会和其他组件的同名样式冲突。

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


### Import CSS / LESS 文件

@symph/joy提供下列插件来处理样式，默认支持post-css、autoprefixer、css-modules、extract-text-webpack等，具体使用方法请查看插件使用文档。

- [@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)
- [@symph/joy-less](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-less)

### 导入图片 

[@symph/joy-image](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)插件提供图片导入功能，详细的配置请参见[插件主页](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)。

```js
  // joy.config.js
const withLess = require('@symph/joy-less')
const withImageLoader = require('@symph/joy-image')

module.exports = {
  serverRender: true,
  plugins: [
    withImageLoader({limit: 8192})
  ]
}
```

使用方法

```js
// in jsx
export default () =>
  <img src={require('./image.png')}/>
```

```css
// in css
.bg {
  background: url("./image.png");
}
```

## 静态文件

在工程根目录下创建`static`目录，将静态文件放入其中，例如：图片、第三方js、css等，也可以创建子目录管理文件，可以通过`{assetPrefix}/static/{file}`路径访问这些文件。

```jsx
export default () => <img src="/static/my-image.png" />
```

## 自定义 Head

@symph/joy 提供了`Head` Component来设置html页面的`<head>`标签中的内容

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

在`head`中重复添加多个相同标签，可以给标签添加`key`属性， 相同的key只会在head中输出一次。

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

在上面的例子中，只有第二个`<meta key="viewport" />`被渲染和添加到页面。

## 获取数据 fetch

`@symph/joy/fetch`用于发送数据请求，该方法在浏览器和Node.js上都可以正常执行。其调用参数和浏览器提供的[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)方法一样。

```jsx
import fetch from '@symph/joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET'})
  .then(respone = >{
      // do something...
  });
```

`@symph/joy/fetch` 支持跨域请求，跨域请求会先发送到Node.js服务端，服务端再转发请求到远程业务服务器上。

TODO 插入流程图

如果想关闭改内建行为，使用jsonp来完成跨域请求，可以在fetch的options参数上设定`options.mode='cors'`

```jsx
import fetch from '@symph/joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET', mode:'cors})
  .then(respone = >{
      // do something...
  });
```

> 也可以使用其它的类似解决方案，例如：[node-http-proxy](https://github.com/nodejitsu/node-http-proxy#using-https)、[express-http-proxy](https://github.com/villadora/express-http-proxy)等。我们内建了这个服务，是为了让开发人员像原生端开发人员一样，更专注于业务开发，不再为跨域、代理路径、代理配置等问题困扰。

如果使用`joy dev`或`joy start`来启动应用，不需要任何配置，即可使用跨域服务。如果项目采用了自定义Server，需要开发者将`@symph/joy/proxy-api-middleware`代理服务注册到自定义的Server中。

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

`createProxyApiMiddleware(options)`支持下列参数，。

- proxyPrefix = ''， 用于设置proxy在服务器上的访问路径，当应用不是部署在host根路径下时，这非常有用。
- onReq = (req, res, reqBody, next) => {}, 浏览器的请求到达proxy时的事件，可以在这里拦截请求或者加工原始请求。
- onProxyReq = ((proxyReq, req, res, options)) => {}, 代理服务器发送请求到业务服务器上时的事件。
- onProxyRes = (proxyRes, req, res, body) => {}, 代理服务器从业务服务器上得到响应。
- onProxyResBody = (proxyRes, req, res, body) => {}, 代理服务器从业务服务器上得到完整的响应body是的时间，可以对body部分进行修改。
- onError = onError(err, req, res) => {}, 发送错误时的回调，一般用打印日志，给客户端返回错误信息等。
- dev = false， 开启调试模式后，会打印详细的请求日志。

## 应用组件

由于javascript语言的开放性，在实际的开发工作中，不同的开发人员，所编写的应用在结构和代码风格上往往存在较大的差异，为了让项目更适合多人协同开发，且易于迭代维护，@symph/joy提供了应用层组件([MVC组件](https://lnlfps.github.io/symph-joy/#/thinking-in-joy?id=mvc%E7%9A%84%E6%80%9D%E8%80%83))来规范代码结构。

![app work flow](https://github.com/lnlfps/static/blob/master/symphony-joy/images/app-work-flow.jpeg?raw=true)

图中蓝色的箭头表示数据流的方向，红色箭头表示控制流的方向，他们都是单向流，内部数据状态是不可变的，这和redux的工作流程是一致的。

- Model: 管理应用的行为和数据，Class类，有初始状态(Redux store中的一部分内容)，业务过程中更新model状态(更新store的状态)
- View: 展示Model中的数据，继承React.Component，展示的数据来源于`props`
- Controller: 控制View的展示，绑定Model数据到View，响应用户的操作，调用Model中的业务, 被`@controller`注释的React.Component

>为了更好的理解以下内容，可先阅读以下相关知识：[redux](https://github.com/reactjs/redux)

### Model

<!-- 在@symph/joy里，我们不应该把业务相关的代码放到Model以外的地方，同时Model也是存放业务数据的地方，我们应该保证同一个数据，在应用中只应唯一的存在一处，这样的数据才可控。 -->

Model管理应用的行为和数据，Model拥有初始状态`initState`和更新状态的方法`setState(nextState)`，这和Component的state概念类似，业务在执行的过程中，不断的更新`state`，当`state`发生改变时，和`state`绑定的View也会动态的更新。这里并没有什么魔法和创造新的东西，只是将redux的`action`、`actionCreator`、`reducer`、`thunk`、`saga`等复杂概念简化为业务方法和状态对象两个概念，让我们更专注于业务实现，代码也更简洁.

下面是一个简单的model示例：

```jsx
import model from '@symph/joy/model'
import fetch from '@symph/joy/fetch'

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
    // fork fetch data
    let pagedProducts = await fetch('https://www.example.com/api/hello', 
      {body:{pageIndex, pageSize}});

    let {products} = this.getState();
    if (pageIndex === 1) {
      products = data;
    } else {
      products = [...products, ...pagedProducts];
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

model将会被注册到redux store中，由store统一管理model的状态，使用`store.getState()[namespace]`来访问对应model的state, store中不能存在两个相同的`namespace`的model。

##### initState

设置model的初始化状态，由于`model.state`可能会被多个`async`业务方法同时操作，所以为了保证state的有效性，请在需要使用state时使用`getState()`来获取当前state的最新值，并使用`setState(nextState)`方法更新当前的state。

##### setState(nextState)

`setState(nextState)`更新model的状态，`nextState`是当前state的一个子集，系统将使用浅拷贝的方式合并当前的状态。

##### getState()

`getState()`获取当前model的状态。

##### getStoreState()

`getStoreState(）`获取当前整个store的状态。

##### dispatch(action)

返回值：Promise，被调用业务的返回值。

在model中使用`await this.dispatch(action)`调用其它业务方法，这和redux的`store.dispatch(action)`的使用一样，由系统分发`action`到指定的model业务方法中, `action.type`的格式为`modelNamespace/serviceFunction`。

如果是调用model自身的业务方法，可以使用`await this.otherService({option})`的方式，`this`指的是model本身。

#### 业务方法

`async service(action)` 业务方法是`async`函数，内部支持`await`指令调用其它异步方法。在controller或者其他model中通过`dispatch(action)`方法调用业务方法并获得其返回值。

#### Dva Model

兼容dva风格的model对象，使用方法：[Dva Concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts_zh-CN.md) ;


### Controller

绑定Model数据到View，调用Model中的业务，并新增了[`async componentPrepare()`](https://lnlfps.github.io/symph-joy/#/thinking-in-joy?id=componentprepare-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)生命周期方法，该方法是一个异步函数，在服务端渲染时，会等待其执行完成后，才会渲染出html，然后浏览器会直接使用在服务端获取到的数据来展现界面，不再重复执行`componentPrepare`方法。如果没有启用服务端渲染，或者在浏览器上动态加载Controller组件时，该方法将在客户端上运行，在一次页面请求的过程中，系统会保证该方法只执行一次，避免数据重复加载。

```jsx
import React, {Component} from 'react';
import ProductsModel from '../models/ProductsModel'
import controller, {requireModel} from '@symph/joy/controller'


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
      pageSize: 10,
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

- 使用`@controller(mapStateToProps)`装饰器将一个普通的Component声明为一个Controller，参数`mapStateToProps`实现model状态和组件props属性绑定，当model的state发生改变时，会触发组件使用新数据重新渲染界面。

- 使用`@requireModel(ModelClass)`注册controller需要依赖的model，这样可以将controller依赖的model打包到一个thunk中，只有在controller运行时，才会去加载依赖的model，通常只需要在第一次使用到model的时候加载一次即可，无需重复注册。

- 每个controller的`props`都会被注入一个redux的`dispatch`方法，`dispatch`方法是controller调用model的唯一途径，该方法的返回值是业务方法的返回值(Promise对象)，这和redux的dispatch方法有差别。

## Router

请查看 [react-router-4 官方文档](https://reacttraining.com/react-router/web/example/basic)
 
### 导入

 ```jsx
 import {Switch, Route, Link} from '@symph/joy/router'
 ```

 ### react-router-redux

 在代码中控制页面跳转

 ```jsx
 import {routerRedux} from '@symph/joy/router'

  ......
  dispatch(routerRedux.push('/abount')))
  ......
  
 ```


## 代码启动 Server

一个独立的`@symph/joy`应用，通常我们使用`joy start`来启动应用。如果想把`@symph/joy`集成到`express`、`koa`等服务端框架中，可以使用代码启动`@symph/joy`应用。

下面例子展示了，如何集成到express中，并且修改路由`\a`到`\b`.

```js
// server.js
const express = require('express')
const joy = require('@symph/joy')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = joy({ dev, dir: '.' })
const handle = app.getRequestHandler()

const server = express()
const preapredApp = app.prepare()

server.get('/a', (req, res) => {
  preapredApp.then(() => {
    return app.render(req, res, '/b', req.query)
  })
})

server.get('*', (req, res) => {
  preapredApp.then(() => {
    return handle(req, res);
  })
})

server.listen(port, (err) => {
  if (err) throw err
  console.log(`> Ready on http://localhost:${port}`)
})
```
> 集成到已有的express服务器中时，我们的应用通常是挂载到url的某个子路径上的，此时请参考[assetPrefix](./configurations#assetPrefix)的配置说明。

`joy(options: object)` API 提供以下参数：
- dev: bool: false  设置为true时，启动开发调试模式，将实时编译源代码、启动热更新等，关闭时，直接运行提前编译好的目标代码(`.joy`目录)。
- dir: string: '.' 应用放置的路径，相对于server.js文件
- quiet: bool: false 是否隐藏服务器错误信息
- conf: object: {} 和`joy.config.js`相同的配置对象，如果设置了该值，则忽略`joy.config.js`文件。

最后修改NPM `start`脚本:

```json
// package.json
{
  "scripts": {
    "build": "build-your-code && joy build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

> 如果express作为业务服务器时，可以将@symph/joy当作express的View模块来使用，用来替代html模板渲染模块。

## 动态导入 import

`@symph/joy`支持JavaScript的TC39 [dynamic import](https://github.com/tc39/proposal-dynamic-import)提议，意味着你可以将代码分割为多个代码块，在浏览器上运行时，按需导入`import`需要的模块。在服务端渲染时，依然使用同步的方式加载`import`的模块，保证渲染出整个页面的内容。

`@symph/joy/dynamic`模块实现了分割代码、动态加载和加载动画等功能，下面展示了其2种用法：

### 基础用法:

```js
import dynamic from '@symph/joy/dynamic'

const DynamicComponent = dynamic({loader: () => import('../components/hello')}, {
   ssr: true,
   loading:<div>...</div>
})

export default () =>
  <div>
    <Header />
    <DynamicComponent />
    <p>HOME PAGE is here!</p>
  </div>
```

### 一次加载多个模块

```js
import dynamic from '@symph/joy/dynamic'

const HelloBundle = dynamic({
  modules: props => {
    const components = {
      Hello1: import('../components/hello1'),
      Hello2: import('../components/hello2')
    }
    // Add remove components based on props
    return components
  },
  render: (props, { Hello1, Hello2 }) =>
    <div>
      <h1>
        {props.title}
      </h1>
      <Hello1 />
      <Hello2 />
    </div>
})

export default () => <HelloBundle title="Dynamic Bundle" />
```

配置参数：
- ssr: bool: true, 设置是否开启服务端渲染
- loading: Component: `<p>loading...</p>` 加载过程中，展示的动画组件

## 自定义 `<Document>`

如果需要在后html文件引入额外的`<script>`或`<link>`等内容，需要自定义<Document>，例如在使用[@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)插件时，需要引入`/_joy/static/style.css`样式文件。

在`@symph/joy`中，所有业务相关的代码都放在`src`目录中。`_document.js`只在服务端渲染使用，并不会在浏览器端加载，所以不能在这里放置任何的业务代码，如果希望在整个应用里共享一部分功能，请将它们放到`src/index.js`应用入口组件中。

```jsx
// /pages/_document.js
import Document, { Head, Main, JoyScript } from '@symph/joy/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html>
        <Head>
          {/* add custom style */}
          <link rel='stylesheet' href='/_joy/static/style.css' />
        </Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </html>
    )
  }
}
```

## 打包部署

部署时，需要先使用`joy build`命令来编译源代码，生成`.joy`目标目录(或者使用[distDir](./configurations#distDir)设置自定义的目录名称)，然后将项目上传到生产机器上，在生产机器上执行`joy start`命令，启动应用。我们可以在`package.json`中添加以下内容：

```json
{
  "name": "my-app",
  "dependencies": {
    "@symph/joy": "latest"
  },
  "scripts": {
    "dev": "joy dev",
    "build": "joy build",
    "start": "joy start"
  }
}
```

`@symph/joy` 可以部署到不同的域名或路径上，可参考[assetPrefix](./configurations#assetPrefix)的设置说明。

> 在运行`joy build`的时候，`NODE_ENV`被默认设置为`production`， 使用`joy dev`启动开发环境时，设置为`development`。如果你是在自定义的Server内启动应用，需要你自己设置`NODE_ENV=production`。

## 静态HTML输出

`joy export`用于将`@symph/joy` app输出为静态版本，只包含html、js、css等静态资源文件，可在浏览器上直接加载运行。静态版本仍然支持`@symph/joy`的大部分特性，比如：MVC组件、动态路由、按需加载等。

`joy export`的原理是提前假设用户的请求，预先渲染为HTML文件，这和当来自浏览器的request到达Node.js服务器上时，实时渲染的工作流程类似。默认只渲染根路径`/`对应的`index.html`文件，浏览器加载该文件后，[Router](https://reacttraining.com/react-router/web/example/basic)组件再根据当前url，加载相应的页面。这要求我们在业务服务器上，例如JAVA的Spring MVC中，使用正则路由来匹配应用内部的所有路径，并都返回`index.js`这个文件，例如：`@RequestMapping(path="/**", method=RequestMethod.GET)`。

```java
@Controller
@RequestMapping("/**")
public class ViewController {

    @RequestMapping(path = "/**", method = RequestMethod.GET)
    public Map<String, Appointment> pages() {
       return "forward:/static/index.html";
    }

}
```

### 导出步骤

`joy export`提供默认的导出配置[`exportPathMap`](./configurations#exportPathMap)，如果需要导出其它页面，请先在`joy.config.js`中设置[`exportPathMap`](./configurations#exportPathMap)。

接下来我们分两步进行导出操作：
1. 编译源代码 `joy build`
2. 预渲染需要导出的页面 `joy export`

添加NPM脚本到`package.json`文件中：

```json
{
  "scripts": {
    "build": "joy build",
    "export": "yarn run build && joy export"
  }
}
```

现在执行下面命令，完成整个导出工作：

```bash
yarn run export
```

执行完成以后，静态版本需要的所有文件都放置在应用根目录下的`out`目录中，只需要将`out`目录部署到静态文件服务器就可以了。

> 你可以定制`out`目录名称，请运行`joy export -h`指令，按提示操作。
