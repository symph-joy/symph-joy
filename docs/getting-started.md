
# 使用指南

## 安装和开始

运行`npm init`创建一个空工程，填写项目的基本信息，当然也可以在一个已有的项目中安装使用。

```bash
npm install --save @symph/joy react react-dom
```
> @symph/joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html)及以上版本

添加NPM脚本到package.json文件：

```json
{
  "scripts": {
    "dev": "joy dev"
  }
}
```

创建`./src/index.js`文件，并插入以下代码：

```javascript
import React, {Component} from 'react'

export default class Index extends Component{
  render(){
    return <div>Welcome to symphony joy!</div>
  }
}
```

然后运行`npm run dev` 命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `npm run dev -- -p <your port here>`

到目前为止，一个简单且完整的前端应用已经创建完成，接下来，我们可以开始进行业务开发了。例子完整工程：[hello-world](https://github.com/lnlfps/symph-joy/tree/master/examples/hello-world)。

到这儿我们拥有了哪些功能呢？

- 应用入口（`./src/index.js`），一切都从这里开始，以后可以添加子路由、布局、Model等组件
- 启动了一个调试服务器，支持服务端渲染和业务请求代理转发等
- 一个零配置的webpack+babel编译器，确保代码在Node.js和浏览器上正确运行
- ES6、7、8等高级语法支持，如：`import`、`class`、`async`、`@`注解、`{...}`解构等
- 热更新，调试模式下，在浏览器不刷新的情况下，使更改立即生效
- 静态资源服务，在`/static/`目录下的静态资源，可通过`http://localhost:3000/static/`访问


## 样式 CSS

### jsx内建样式

内建了 [styled-jsx](https://github.com/zeit/styled-jsx) 模块，无需配置，可直接使用。支持Component内独立域的CSS样式，不会和其他组件的同名样式冲突。

```javascript
import React from 'react'

export default () =>
  (<div>
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
  </div>)
```

查看  [styled-jsx 详细使用文档](https://www.npmjs.com/package/styled-jsx) 


### Import CSS / LESS 文件

@symph/joy提供下列插件来处理样式，默认支持post-css、autoprefixer、css-modules、extract-text-webpack等，具体使用方法请查看插件使用文档。

- [@symph/joy-css](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-css)
- [@symph/joy-less](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-less)

### 导入图片 

[@symph/joy-image](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)插件提供图片导入功能，详细的配置请参见[插件主页](https://github.com/lnlfps/joy-plugins/tree/master/packages/joy-image)。

```javascript
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

```javascript
// in jsx
export default () =>
  <img src={require('./image.png')}/>
```

在css、less文件中使用

```css
.bg {
  background: url("./image.png");
}
```

## 静态文件

在工程根目录下创建`static`目录，将静态文件放入其中，例如：图片、第三方js、css等，也可以创建子目录管理文件，可以通过`{assetPrefix}/static/{file}`访问这些文件，也可使用`asset`方法得到最终的访问路径 。

```javascript
export default () => <img src="/static/my-image.png" />

//or 
import asset from '@symph/joy/asset'
export default () => <img src={asset("/my-image.png")} />
```

## 自定义 Head

@symph/joy 提供了`Head` Component来设置html页面的`<head>`标签中的内容

```javascript
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

```javascript
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

在上面的例子中，只有第二个`<meta key="viewport" />`被渲染和添加到最终页面。

## 代理服务

`@symph/joy`内建了代理转发服务器，支持`web`和`websocket`转发，请求由浏览器发送到代理服务器，再由代理服务器发送到业务服务器。

在`joy.config.js`中配置代理服务器，下面实例如何开启代理服务器，并转发`/api`路径上的请求。

```javascript
// joy.config.js 里配置代理点
module.exports = {
  proxy: {
    enable: true,
    routes:[
      {
        type: 'web',
        path: '^/zhihu-api/',  // 匹配到该路径的请求，都会被转发到target指定的目标地址上。
        target: 'https://news-at.zhihu.com',
        pathRewrite: {
          '/zhihu-api/': '/'
        }
      }
    ]         
  }
}
```

```javascript
// 客户端浏览器上，通过该代理点请求数据

async function fetchData(){
  // 最终访问的地址为 https://news-at.zhihu.com/api/3/news/hot
  let response = await fetch('/zhihu-api/api/3/news/hot', {method: 'GET'})
}
```

和自定义server服务器集成，例如`express`，需要开发者将`@symph/joy/proxy-middleware`中间件注册到`express`中。

```javascript
const express = require('express')
const joy = require('@symph/joy')
const {createProxyMiddleware} = require('@symph/joy/proxy-middleware')
const dev = process.env.NODE_ENV !== 'production'

const server = express()
const app = joy({ dev })
const handle = app.getRequestHandler()
const preparedApp = app.prepare()
const proxyOptions = {enable: true, dev: true}
server.use(createProxyMiddleware(proxyOptions))  //register proxy, 
server.use((req, res, next)=>{
  preparedApp.then(()=> {
    handle(req, res)
  })
})
server.listen(3000)
```

`createProxyApiMiddleware(options)`支持的参数和在`joy.config.js`中配置`proxy`时一致。


### 使用注意事项
- 前端域名下的cookie会一起发送到目标服务器，如对目标服务器不信任，需采取措施来避免数据的泄露和冲突，例如监听`onProxyReq`事件，在proxy发送请求到目标服务器之前，去掉敏感数据。

### proxy 配置
    
- **enable**: 类型`bool`，默认`true`， 如果为false，将关闭整个代理服务器。

- **autoProxy**: 类型`bool`，开发环境(NODE_ENV=development)默认true，其它环境默认false。配置自动代理服务，在浏览器上使用[`@symph/joy/fetch`](#发送请求-fetch)发送请求，在浏览器上`@symph/joy/fetch`检测到请求跨域了，会将请求地址转为`${proxy.host}/__proxy/${pathname}`，请请求发送到代理服务器，再由代理发送请求到目标服务器。

> 注意：在生产环境，要谨慎使用`autoProxy`自动代理服务器，以防被人恶意利用，例如试探内部网络和接口、或者转发恶意非法请求、网络攻击等。在生产环境，建议使用`proxy.routes`配置，明确定义每个代理点的行为，避免越界使用。

- **routes**: 类型`ProxyRoute`的数组，默认空，设置各个代理点。

- **dev**: 类型`bool`，默认`false`，开启调试模式后，会打印一些代理日志。

#### ProxyRoute 配置

- **path**: 类型`string`，不能为空，定义该代理点能处理的客户端请求路径，支持正则字符串，最终由RegExp生成正则表达式，和`request.path`进行匹配。

- **target**: 类型`string`, 不能为空，目标服务器地址，包含协议、域名、端口，也可以包含部分公共路径。例如：`https://service.com:8080/api/v1`。

- **type**: 类型`string`, 默认`web`，支持`web`和`websocket`。

- **xfwd**: 类型`bool`，默认`true`，在转发请求时，是否在发往目标服务器的请求里追加`x-forwarded-xxx`协议头。

- **secure**: 类型`bool`，默认`false`，是否验证SSL证书。

- **ssl**: 类型`Object`，默认`null`，配置https连接，将会被传入https.createServer()中。

- **ignorePath**: 类型`bool`，默认`false`，是否忽略客户端请求的path部分，如果为true，则代理服务器发送请求到目标服务器上时，将不会包含原始请求的path部分。

- **pathRewrite**: 类型`Object`，默认`null`, 重写客户端请求路径，可配置的值:
  -  Object, 但在对应关系替换，只替换第一次匹配到的路径。例如：

```javascript
{
  "/old_path/": "/new_path/",  // 替换为新的path
  "/path/": "/",               // 删除path
  "/": "/path/"                // 在路径前面添加新的path
}
```

- **prependPath**: 类型`bool`，默认`true`，将target定义path部分，添加到客户端请求path的前面。

- **localAddress**: 类型`string`，默认`null`, 本地连接到远程的接口地址。

- **changeOrigin**: 类型`bool`，默认`true`，改变客户端请求header中的host值，如果为false，客户端在发送请求时，必须确保header中设置正确目标的host，否则浏览器默认添加为代理服务器的host地址，这可能导致最终请求失败。

- **preserveHeaderKeyCase**: 类型`bool`，默认`true`, 设置是否需要保持客户端请求header字段名称的大小写，默认会将header中的字段转换为全小写。

- **auth**: 类型`string`，默认`null`, 在发往目标服务器的请求中添加基本认证信息。例如：'user:password'。

- **hostRewrite**: 类型`string`，默认`null`，当 (201/301/302/307/308) 时，使用该值重写业务服务器响应headers["location"]里的hostname。

- **autoRewrite**: 类型`bool`，默认`false`, 当 (201/301/302/307/308) 时，基于客户端的原始请求，自动重写业务服务器响应headers["location"]里的host/port。

- **protocolRewrite**: 类型`string`，默认`null`，使用该值重写业务服务器响应headers["location"]里的协议部分，例如：http或者https。

- **cookieDomainRewrite**: 类型`bool|string|object`，默认`false`，重写'set-cookie'头中的domain，可配置的值:

  - bool, 默认false， 关闭cookie重写
  - string，新的domain，例如：`cookieDomainRewrite: "new.domain"`。如果需要删除domain，使用`cookieDomainRewrite: ""`
  - object, 按照对应关系替换，使用`"*"`匹配所有的domain，例如：
```javascript
cookieDomainRewrite: {
  "unchanged.domain": "unchanged.domain", //保存不变
  "old.domain": "new.domain",             // 替换为新的domain
  "*": ""                                 // 删除其它的domain
}
```

- **cookiePathRewrite**: 类型`bool|string|object`，默认`false`，重写'set-cookie'头中的路径，可配置的值:

  - bool, 默认false， 关闭cookie重写， TODO 支持true选项，代表auto选项，自动根据原始请求设置该值
  - string，新的path，例如：`cookiePathRewrite: "/newPath/"`。删除path `cookiePathRewrite: ""`，设置为根路径`cookiePathRewrite: "/"`
  - object, 按照对应关系替换，使用`"*"`匹配所有的path，例如：
```javascript
cookiePathRewrite: {
  "/unchanged_path/": "/unchanged_path/",   //保存不变
  "/old_path/": "/new_path/",               // 替换为新的path
  "*": ""                                   // 删除其它的path
}
```

- **headers**: 类型`object`，默认`null`, 设置额外的请求头到目标请求上。

- **proxyTimeout**: 类型`number`，默认`0`, 单位毫秒，发往目标服务器请求socket超时时间。

- **timeout**: 类型`number`，默认`0`, 单位毫秒，接收客户端请求socket超时时间。

- **followRedirects**: 类型`bool`，默认`false`, 和目标服务器通信是自动处理重定向。

- **onError**: 当发生异常时触发该事件。代理内部不会处理任何的异常信息，包括客户端和代理之间通信时发现的异常，以及代理和目标服务器通信时发现的异常，所以我们建议由你来监听和处理异常。

```javascript
function onError (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
 }
```

- **onProxyReq**: 代理向目标服务器发送数据之前触发该事件，可以在这里修改proxyReq请求对象，适用于websocket类型的连接。

```javascript
function onProxyReq (proxyReq, req, res) {
  console.log('Target path', proxyReq.path);
}
```

- **onProxyReqWs**: 代理向目标服务器发送数据之前触发该事件，可以在这里修改proxyReq请求对象。适用于websocket类型的连接。

```javascript
function onProxyReqWs (proxyReq, req, res) {
  console.log('Target path', proxyReq.path);
}
```

- **onProxyRes**: 当从目标服务器得到响应时触发，可以在这里得到响应的数据，对数据进行编辑，然后输出给客户端。

```javascript
function onProxyRes (proxyRes, req, res) {
  console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
}
```

- **onOpen**: 当代理和目标服务器的websocket创建完成，并且管道建立连接时触发一次。

```javascript
function onOpen (proxySocket) {
  // listen for messages coming FROM the target here
  proxySocket.on('data', hybiParseAndLogMessage);
}
```

- **onClose**: 当代理的websocket关闭时触发一次。

```javascript
function onClose (res, socket, head) {
  // view disconnected websocket connections
  console.log('Client disconnected');
}
```


## 发送请求 fetch

和浏览器端的[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)完全兼容，`@sympy/joy/fetch`提供了额外功能：

- 在浏览器和node.js都可以正常运行，可实现一份代码多处运行，在启用服务器渲染时，这是必须的。
- 自动代理，当检测到跨域请求，请求将被自动转发到[代理服务器](#代理服务)上，再由代理发送请求到目标服务器，最后将数据返回给客户端。如果使用`joy dev`以开发模式运行应用，该特性默认开启，方便前后端分离开发。

```javascript
import fetch from '@symph/joy/fetch'

// 下面是跨域请求
fetch('https://news-at.zhihu.com/api/3/news/hot')
  .then(respone => {
      // 处理数据
    }
  );

// or 
async function fetchData(){
  let response = await fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET'})
}
```

如果关闭代理转发功能，例如使用cors来完成跨域请求，可以在fetch的options参数明确设定`mode='cors'`

```javascript
import fetch from '@symph/joy/fetch'

async function fetchData(){
  let response = await fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET',  mode:'cors'})
}
```

当`joy.config.js`的`autoProxy`开启时，默认代理路径为`http://my_host.com/__proxy/`，如我们将其部署在`http://my_host.com/h5/__new_proxy/`时，需要通过`proxyPath`参数设置代理访问路径，例如：

```javascript
import fetch from '@symph/joy/fetch'

async function fetchData(){
  let response = await fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET', proxyPath: '/h5/__new_proxy/'})
}
```

> 也可以使用其它的类似解决方案，例如：[node-http-proxy](https://github.com/nodejitsu/node-http-proxy#using-https)、[express-http-proxy](https://github.com/villadora/express-http-proxy)等。我们内建了这个服务，是为了可以像原生端开发人员一样，更专注于业务开发。

## 应用组件

@symph/joy采用 [MVC组件](https://lnlfps.github.io/symph-joy/#/thinking-in-joy?id=mvc%E7%9A%84%E6%80%9D%E8%80%83) 来规范应用各组件的职责。

- Model类: 管理应用行为，其内部状态保存着应用数据，业务运行中不断更新内部状态，控制业务流和数据流的流转。
- View组件: 负责展示应用数据，继承React.Component
- Controller组件: 控制和协调View和Model，绑定Model数据到View，响应用户的操作，调用Model中的业务, 其继承于React.Component，或是实现了hook的函数组件。

![app work flow](https://github.com/lnlfps/static/blob/master/symphony-joy/images/app-work-flow.jpeg?raw=true)

图中蓝色的箭头表示数据流的方向，红色箭头表示控制流的方向，他们都是单向流。和[redux](https://redux.js.org/)的运行流程一样，store中的`state`对象是不可修改的，状态发生改变后，都会生成一个新的state对象，且只将有变化的部分更新到界面上。

> 这里只是对redux进行MVC层面的封装，并未添加新的技术，依然可以使用redux的原生接口，如果想深入了解redux，请阅读其详细文档：[redux](https://redux.js.org/)

### 依赖注入 @autowire

依赖注入是指，组件在创建的时候，系统自动将其所依赖的其它组件对象传递给它，这使组件内部不再负责其它依赖组件的引用和初始化，系统将保证其内部各组件以正确的顺序初始化，并管理初始化后的组件。在@symph/joy中，Controller依赖于Model实现业务调用，Model也可能需要其它Model共同完成一件事情，系统将在需要的时候加载Model并初始化它。

下面简单介绍下如何在Controller中申明依赖的Model，以及如何调用Model中的业务方法，本文稍后将详细接受Controller和Model组件。

```javascript
import React from 'react'
import controller from '@symph/joy/controller'
import autowire from '@symph/joy/autowire'
import UserModel from './UserModel'

@controller()
export default class Comp extends React.Component{

  @autowire()
  userModel: UserModel

  onClickBtnLogin = () => {
    this.userModel.login()
  }
  
  render(){
    // ...
  }
}
```
`@autowire()`装饰器申明一个属性需要依赖注入，`userModel: UserModel`是ES6申明类实例属性的语法，`: UserModel`部分是TypeScript的类型申明语法，声明该属性的类型为`UserModel`。系统将在初始化该组件的时候，自动注入`UserModel`的实例到该属性上，之后就可以通过`this.userModel.login()`的方式调用model中定义的业务方法。


### Model

Model管理应用的行为和数据，Model拥有初始状态`initState`和更新状态的方法`setState(nextState)`，这和Component的state概念类似，业务在执行的过程中，不断更新`state`，当`state`发生改变时，和`state`绑定的View也会自动的更新。这里并没有什么魔法和创造新的东西，只是将redux的`action`、`actionCreator`、`reducer`、`thunk`、`saga`等复杂概念简化为业务方法和业务数据两个概念，让我们更专注于业务实现.

下面是一个简单的model示例：

```javascript
import model from '@symph/joy/model'
import fetch from '@symph/joy/fetch'

@model()
export default class TodosModel {

  // the mount point of store state tree, must unique in the app.
  namespace = 'todos';

  // this is the initial state of model
  initState = {
    pageSize: 5,
    count: 0,
    entities: [],
  };

  async getTodos({pageIndex = 0, pageSize = 5}) {
    // fetch remote data
    let reponse = await fetch('https://www.example.com/api/hello', 
      {body:{pageIndex, pageSize}});
    let pagedTodos = await response.json()

    let {entities} = this.getState();
    if (lastId === 0) {
      // first page
      entities = pagedTodos;
    } else {
      entities = [...entities, ...pagedTodos];
    }
    
    // update model's state
    this.setState({
      entities,
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

如果是调用model自身的业务方法，可以使用`await this.otherService(options)`的方式，`this`指的是model本身。

#### 业务方法

我们可以在Model中定义任意的实例方法来实现业务逻辑，例如：`async getTodos()` ，该方法是一个`async`函数，所以可以轻松的使用`await`指令来实现异步逻辑调用，以及调用其它业务方法。

调用方式：
1. `todosModel.getTodos({lastId: 0, pagesSize:5})` 在Model的实例上直接调用
2. `dispatch({type:"todos/getTodos", lastId: 0, pageSize: 5})` 通过redux的dispatch方法，调用当前store中已注册的model实例上的方法。

### Controller

Controller需要申明其依赖哪些Model，并绑定Model的中的状态，以及调用Model里的业务方法。它是一个React组件，可以像其它React组件一样创建和使用，新增了[`async componentPrepare()`](https://lnlfps.github.io/symph-joy/#/thinking-in-joy?id=componentprepare-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)生命周期方法，在组件执行完构造方法后执行，在服务端渲染时，会等待其执行完成后，再渲染出html，接着在浏览器上运行时，会直接使用在服务端prepare得到的数据，不再执行该方法。如果没有启用服务端渲染，或者在浏览器上动态加载Controller组件时，该方法将在组件初始化完成后，立即上运行。在一次页面请求的过程中，系统会保证该方法只执行一次，避免重复加载数据。

```javascript
import React, {Component} from 'react';
import TodosModel from '../models/TodosModel'
import {controller} from '@symph/joy/controller'
import {autowire} from '@symph/joy/autowire'

@controller((state) => {              // state is store's state
  return {
    todos: state.todos.entities // bind model's state to props
  }
})
export default class IndexController extends Component {

  @autowire()
  todosModel: TodosModel              // register model

  async componentPrepare() {
    // call model
    await this.todosModel.getTodos({pageIndex: 0, pageSize: 5})
    // or use dispatch to call model
    // await this.props.dispath({type: 'todos/getTodos', pageIndex: 0, pageSize: 5})
  }

  render() {
    let {todos = []} = this.props;
    return (
      <div >
        <div>Todo List</div>
        <div>
          {todos.map((todo, i) => {
            return <div key={todo.id} >{todo.id}:{todo.content}</div>
          })}
        </div>
      </div>
    );
  }
}

```

创建和使用Controller的步骤：

- 使用`@controller(mapStateToProps)`装饰器将一个普通的Component声明为一个Controller，参数`mapStateToProps`实现model状态和组件props属性绑定，当model的state发生改变时，会触发组件使用新数据重新渲染界面。

- `@autowire()`声明该属性的类型是一个Model，运行时，`@symph/joy`将自动初始化该Model，并绑定到该属性上。打包时，Controller依赖的Model也将一起打包thunk中，这样在controller运行时，才会去加载依赖的Model。

- 每个controller的`props`会被注入一个`dispatch`方法，`dispatch`是redux提供的方法，我们可以由此来调用model、reducer、effect等redux支持的方法。

### View

View是一个普通的React组件，其只负责界面展示，展示的数据来自父组件，通过`this.props`属性读取。 

```javascript
import React, {Component} from 'react'

export default class ImageView extends Component {
  render() {
    let {src} = this.props
    return (
      <img src={src} />
    )
  }
}
```

### Hooks

`@symph/joy/hooks`提供了一些hook，以便在React函数组件中，获取Model的状态，以及调用Model中的业务方法。

`React.useEffect` hook是在render以后执行，类似于`componentDidMount`和`componentDidUpdate`生命周期，在服务端渲染时，`React.useEffect`不会被执行，因此我们也无法获取到应用数据，渲染出需要的界面。 所以在编译期，`@symph/joy`所以使用了`@symph/joy/hook`中的同名方法`useEffect`方法替换了`React.useEffect`，使其支持服务端渲染，以及防止数据重复加载等问题。如果你想保持其默认行为，可以在代码中直接使用用`@symph/joy/hook`中的`useReactEffect`，它只是`React.useEffect`的别名。

下面示例了如果在函数组件中使用hook

```javascript
import React, { useCallback, useEffect } from 'react'
import { useMappedState, useModel } from '@symph/tempo/hook'
import TodosModel from '../models/TodosModel'

export default function TodoDetailController ({match}) {
  const todoId = Number(match.params.id)
  const [todosModel] = useModel([TodosModel])

  // Declare your memoized mapState function
  const mapState = useCallback(
    (state) => {                // state is store's state
      return {
        todo: state.todos.details[todoId]
      }
    },
    [todoId],
  )
  // Get data from and subscribe to the store
  let {todo} = useMappedState(mapState)

  useEffect(() => {
    todosModel.getTodo(todoId)
  }, [todoId])

  if(todo){
    return  <div>loading...</div>
  }
  return (
    <div className={styles.root}>
      <h1>Todo Detail</h1>
      <div>
         <div>ID: {todo.id}</div>
         <div>content: {todo.content}</div>
      </div>
    </div>
  )
}
```
#### Hooks API

##### useMappedState(mapState)

mapState: `useCallback((state) => newState, inputs)` 和mapStateToProps方法类似，用于获取和绑定model中的状态，返回供组件使用的状态对象。

这里需要使用`React.useCallback`对状态映射函数进行包装，可避免每次render都执行一次状态绑定。

```javascript
  // Declare your memoized mapState function
  const mapState = useCallback(
    (state) => {                // state is store's state
      return {
        todo: state.todos.details[todoId]
      }
    },
    [todoId],
  )
  // Get data from and subscribe to the store
  let {todo} = useMappedState(mapState)
```

##### useModel(modelArray)

modelArray: 数组类型，元素为需要使用的Model的class。

返回值: 数组类型，返回Model类的实例，和modelArray参数中传入的class列表一一对应。

我们传入Model的class类，得到Model的实例，这里依然使用了依赖注入的部分概念，不用关系Model如何被加载和初始化的，系统会在适当的时候处理这些，我们在业务组件里，只需要关心拿到Model实例，以及调用他们。

```javascript
import UserModel from './UserModel'
import TodoModel from './TodoModel'

const [userModel, todoModel] = useModel([UserModel, TodoModel])
```

##### useDispatch()

返回值: 返回`dispatch`方法，用于调用`redux`的原生api。

```javascript
const dispatch = useDispatch()
```

##### useEffect(effect, inputs)

和[`React.useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect)和用途和用法一样，但该方法支持服务端渲染。开发者一般不会直接调用该方法，`@symph/joy`在编译期间，会使用该方法替换`React.useEffect`，以保证应用内的`useEffect`在服务端渲染时，被正确的执行。

**effect**: 副作用函数

**inputs**: 数组类型，只有当数组内的元素值发生改变后，`effect`才会被重新执行。 等于`[]`空数组时，`effect`函数只执行一次， 等于`undefined`时，`effect`每次都会执行。

```javascript
useReactEffect(
  () => {
    const subscription = props.source.subscribe();
    return () => {
      subscription.unsubscribe();
    };
  },
  [props.source],
);
```

##### useReactEffect(effect, inputs)

等于react原生提供的`React.useEffect`，`@symph/joy`默认会对`React.useEffect`进行封装，以便其支持服务端渲染，如果需要屏蔽该默认行为，请在代码中直接使用该方法替换`React.useEffect`。


#### 兼容 Dva

@symph/joy兼容dva的Model开发模式，[Dva概念 官方文档](https://dvajs.com/guide/concepts.html#models) 

```javascript
  import {controller, requireModel} from '@symph/joy/controller'
  import MyDvaModel from './MyDvaModel'
  
  @requireModel(MyDvaModel)
  @controller()
  class MyComponent extends Component {
  
    componentDidMount(){
      this.props.dispatch({
        type: 'myDvaModel/getData',
      })
    }
    
    // ...
   
  }
```

使用`@requireModel()`注册dva的model，其它使用方法和dva保持一致

## Router

请查看 [react-router-4 官方文档](https://reacttraining.com/react-router/web/example/basic)
 
### 导入方法

 ```javascript
 import {  StaticRouter,
           BrowserRouter,
           Switch,
           Route,
           createServerRouter,
           createClientRouter,
           Link,
           HashRouter,
           NavLink,
           Prompt,
           MemoryRouter,
           Redirect,
           Router,
           withRouter,
           routerRedux } from '@symph/joy/router'
 ```

 ### react-router-redux

 在代码中控制页面跳转

 ```javascript
 import {routerRedux} from '@symph/joy/router'

 ...
   dispatch(routerRedux.push('/abount')))
   
   //or
   dispatch(routerRedux.push({
     pathname: '/about',
     search: `?x=xxx`
   }))
 ...
  
 ```


## 代码启动 Server

如果需要把`@symph/joy`集成到`express`、`koa`等服务端框架中，可以使用代码启动`@symph/joy`应用。

下面例子展示如何集成到express中，并且修改路由`\a`到`\b`.

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

> 如果express作为业务服务器时，可以将@symph/joy当作express的View模块来使用。

## 按需加载 dynamic

`@symph/joy`支持JavaScript的TC39 [dynamic import](https://github.com/tc39/proposal-dynamic-import)提议，意味着你可以将代码分割为多个代码块，在浏览器上运行时，只加载当前需要的代码块。

`@symph/joy/dynamic`模块实现了分割代码、动态加载等功能，下面展示了其2种用法：

### 基础用法:

```js
import dynamic from '@symph/joy/dynamic'

const DynamicComponent = dynamic({
  loader: () => import('../components/hello'),
  ssr: true, // 如果关闭，服务端渲染时，该组件将不会被渲染。
  loading:() => <div>...</div>
})

export default () =>
  <div>
    <Header />
    <p>HOME PAGE is here!</p>
    <DynamicComponent />
  </div>
```

### 一次加载多个模块

```js
import dynamic from '@symph/joy/dynamic'

const HelloBundle = dynamic({
  modules: {
      Hello1: () => import('../components/hello1'),
      Hello2: () => import('../components/hello2')
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
- loader: function: null, 加载器，定义动态加载的内容
- ssr: bool: true, 设置是否开启服务端渲染
- loading: Component: `<p>loading...</p>` 加载过程中，展示的动画组件

## 自定义 `<Document>`

如果需要定制html文档的内容，例如引入额外的`<script>`或`<link>`等，可在src目录中新建`_document.js`文件，参考下面的示例加入自定义的内容。

```javascript
// /src/_document.js
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

`_document.js`只在服务端渲染时使用，不会在浏览器端加载，所以不能在这里放置任何的业务代码，如果希望在整个应用里共享一部分功能，请将它们放到`src/index.js`应用入口组件中。


## 自定义 Error 界面

渲染时出现未捕获的异常时，可以自定义错误展示组件，来友好的提示或者引导用户，例如500错误。这只在`process.env.NODE_ENV="production"`环境有效，在开发模式下，系统将展示详细的错误堆栈信息，来帮助开发人员定位问题。

创建`src/_error.js`文件来替换默认的错误展示组件。

```javascript
// src/_error.js

import React from 'react'
import Head from './head'

export default class _Error extends React.Component {
  render () {
    const { statusCode, message } = this.props
    const title = statusCode === 404
      ? 'This page could not be found'
      : 'An unexpected error has occurred'

    return <div>
      <Head>
        <title>{statusCode}: {title}</title>
      </Head>

       <h1>{statusCode}</h1>
       <div>{message}</div>
    </div>
  }
}
```

## 打包部署

在package.json中配置一下脚本，用于打包和启动应用

// package.json
```json
{
  "scripts": {
    "dev": "joy dev",
    "build": "joy build",
    "start": "joy start"
  }
}
```

1. 编译：运行`npm run build`命令，启动编译流程，生成可在浏览器和node.js里直接运行的目标代码，并对生成的代码进行压缩、混淆、分割等优化处理。编译后的代码放在`.joy`([distDir](./configurations#distDir)可自定义输出目录名称)目录中。
2. 部署：将项目目录下的`.joy`、`package.json`、`node_modules`、`joy.config.js`文件复制到生产机器上。
3. 启动应用：在生产机器上，运行`npm run start`启动应用。

`@symph/joy` 可以部署到不同的域名或路径上，这需要对应用内引用的资源路径进行配置，参考[assetPrefix](./configurations#assetPrefix)的设置说明。

> 在运行`joy build`的时候，`NODE_ENV`被默认设置为`production`， 使用`joy dev`启动开发环境时，设置为`development`。如果你是在自定义的Server内启动应用，需要你自己设置`NODE_ENV=production`。

## 静态版本部署

`joy export`用于将`@symph/joy` app输出为静态版本，只包含html、js、css等静态资源文件，不需要node作为服务器，可直接部署在cCDN或者静态资源服务器上，浏览器端直接加载运行。静态版本仍然支持`@symph/joy`的大部分特性，比如：MVC组件、动态路由、按需加载等。

`joy export`的原理是提前假设用户的请求，预先将React应用渲染为HTML文件，这和当请求到达Node.js服务器上时，实时渲染的工作流程类似。

### 导出配置

默认只导出首页，即url `/` 根路径对应的页面，如果需要导出其它页面，请先在`joy.config.js`中设置[`exportPathMap`](./configurations#exportPathMap)。

下面是一个简单的配置示例，配置了导出首页`index.html`和`about.html`这两个页面，且最终应用会部署到`http:www.example-cdn.com/my-app`这个静态url路径下。
```js
// joy.config.js
module.exports = {
  assetPath: 'http://www.example-cdn.com/my-app',
  exportPathMap: async function () {
    return {
      '/': null, // 导出首页
      '/about.html': request // 导出about.html页面，request为渲染页面的request参数对象，可以这样{query:{pageIndex:1}}设置query参数
    }
  }
}
```

### 导出步骤

在package.json中添加NPM脚本

// package.json
```json
{
  "scripts": {
    "build": "joy build",
    "export": "npm run build && joy export"
  }
}
```

执行 `npm run export` 执行导出过程，导出过程分为两步：
1. 编译源码：运行`npm run build`命令，生成可在浏览器和node.js里直接运行的目标代码，并对生成的代码进行压缩、混淆、分割等优化处理。编译后的代码放在`.joy`([distDir](./configurations#distDir)可自定义输出目录名称)目录中。
2. 导出静态版本: `joy export`命令，启动一个用于导出的Node服务器，导出`exportPathMap`中配置的页面。

最终生成目录结构
```
project
|   .joy.config.js
└---.joy
|  |  server/
|  |  static/
|  |  build-manifest.json
└---out
|  |  _joy/
|  |  static/
|  |  index.html
|  |  about.html
|  ...
```

执行完导出操作后，应用根目录下将会生成`out`目录，其中包含在浏览器上运行时需要的所有文件。

### 部署

只需要将`out`目录中的内容部署到静态文件服务器，最终通过`http://www.example-cdn.com/my-app/about.html` url路径，访问导出的`about.html`文件。

> 你可以定制`out`目录名称，请运行`joy export -h`指令，按提示操作。

### 应用服务器配置

默认只渲染输出`index.html`文件，这也是单页面应用常见的入口页面，浏览器加载该文件后，由浏览器端的路由组件[Router](https://reacttraining.com/react-router/web/example/basic)根据当前完整`window.location.href`路径，渲染具体的页面内容。

这要求我们在业务服务器上，例如JAVA的Spring MVC中，使用正则路由来匹配应用内部的所有的页面路径，并都返回`index.js`这个文件，例如：`@RequestMapping(path="/**", method=RequestMethod.GET)`。

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

也可以在nginx中配置反向代理路由，当任何页面请求到达时，返回`index.html`文件给浏览器。

下面的nginx配置例子展示了，在nginx服务器上，将`http://www.nginx-example.com/frontend-app/todo/1`请求代理到静态资源服务器`http://www.static-example.com/static-app/index.html`文件上。
```
location ^~ /frontend-app/ {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-http_x_forwarded_for $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            rewrite /frontend-app/(.+)$ /static-app break;
            proxy_pass http://www.static-example.com ;
        }
```
