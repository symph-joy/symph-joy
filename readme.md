# @symph/joy

@symph/joy 的目标是创建高效开发和用户体验的SPA React应用，灵感来自于Next.js和Dva等优秀的开源库，在此非常感谢以上开源贡献者的辛勤付出。


## 特征

以下特征功能均可零配置实现, @symph/joy默认为应用良好运行提供了默认配置，当然也可以定制配置。
 
- 零配置生成浏览器和node端代码，自动编译和打包源码（使用webpack和babel）
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

- [@symph/joy-css](https://github.com/zeit/next-plugins/tree/master/packages/next-css)
- [@zeit/next-sass](https://github.com/zeit/next-plugins/tree/master/packages/next-sass)
- [@zeit/next-less](https://github.com/zeit/next-plugins/tree/master/packages/next-less)


## 访问静态文件

在工程根目录下创建`static`目录，在代码里，通过在url前面添加`/static/`前缀来引用里面的资源

```jsx
export default () => <img src="/static/my-image.png" />
```

## 自定义 Head

symphony-joy 提供了内建的component来自定义html页面的<head>部分

```jsx
import Head from 'symphony/head'

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
import Head from 'next/head'
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

symphony-joy提供了`symphony-joy/fetch`方法来获取远程数据， 其调用参数和浏览器提供的[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)方法保持一致。

```jsx
import fetch from 'symphony-joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET'})
  .then(respone = >{
      // do something...
  });
```

`symphony-joy/fetch` 内建提供简单的跨域解决方案，在浏览器发起的跨域请求，会先被封装后转发到服务端，由服务端完成远端的数据请求和将响应转发给浏览器端，服务端作为自动的代理服务器。

TODO 插入流程图

如果想关闭改内建行为，使用jsonp来完成跨域请求，可以在fetch的options参数上设定`options.mode='cors'`

```jsx
import fetch from 'symphony-joy/fetch'

fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET', mode:'cors})
  .then(respone = >{
      // do something...
  });
```

> 在不做任何配置的前提下，依然可以使用其它的类似解决方案，例如：[node-http-proxy](https://github.com/nodejitsu/node-http-proxy#using-https), [express-http-proxy](https://github.com/villadora/express-http-proxy)等，在服务端搭建proxy服务。我们内建了这个服务，是为了让开发人员像原生端开发人员一样，更专注于业务开发，不再为跨域、代理路径、代理服务配置等问题困扰。

## 应用组件

<!-- 由于javascript语言的开放性，在实际的开发工作中，不同的团队和开发人员，所形成的应用在结构和代码风格上往往存在较大的差异，这给维护迭代和多人协同开发带来了麻烦，再由于symphony-joy在提供高级功能的同时，难免会来带一些副作用，为了避免以上问题，我们所以提供了以下应用层组件，保证应用的协同高效运行。 -->

![app work flow](https://github.com/lnlfps/static/blob/master/symphony-joy/images/app-work-flow.jpeg?raw=true)

图中蓝色的箭头表示数据流的方向，红色箭头表示控制流的方向，在内部使用redux来实现整个流程，为了更好的推进工程化以及简化redux的实现，我们抽象了出了Controller和Model两个类。

>为了更好的理解以下内容，查先查阅一下知识点：[redux](https://github.com/reactjs/redux)， [dva concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts.md)

### Controller

Controller的作用是管理View和model状态的绑定，新增了`componentPrepare`生命周期方法，用于在界面渲染前获取业务数据，在服务端渲染时，`componentPrepare`会在服务端被执行一次，等待里面的所有数据获取方法执行完成后，才会渲染出界面返回给浏览器，浏览器会复用服务端准备的数据，不会执行再次执行该方法，如果没有启动服务端渲染，或者是在运行时动态加载的界面，该方法将在客户端上自动运行。


```jsx
import React, {Component} from 'react';
import controller from 'symphony-joy/controller'

@controller((state) => ({
  me: state.user.me
}))
export default class UserController extends Component {

  componentPrepare() {
    let {dispatch} = this.props;
    dispatch({
      type: 'user/fetchMyInfo'
    })
  }

  render() {
    let {user} = this.props;
    return (
      <div>
        user name：{me ? me.name : 'guest'}
      </div>
    );
  }
}
```

在上面，我们使用`@Controller(mapStateToProps)`装饰器来将一个普通的React Component声明为一个Controller，同时提供`mapStateToProps`的参数来将model状态和组件props属性绑定， 当model的状态发生改变时，同时会触发props的改变。

每个controller的`props`都会被注入一个redux的`dispatch`方法，`dispatch`方法是controller给model发送action的唯一途径，`action`是一个普通对象，其type属性指定了对应的model和方法。

### Model

Model拥有初始状态`initState`和更新state的方法`setState(nextState)`，和Component的state概念类似，这里并没有什么魔法和创造新的东西，只是将redux的`action`、`actionCreator`、`reducer`,`thunk`等难以理解的概率抽象成业务状态和流程，并封装到同一个model中，从而使开发人员更专注于业务，同时实现业务和展现层的分离.

下面是一个简单的model对象示例：

```jsx
import model from 'symphony-joy/model'

@model()
export default class ProductsModel {

  // the mount point of store state tree, must uniq in the app.
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

我们使用`@model()`将一个类声明为Model类，Model类在实例化的时候会添加`getState`、`setState`，`dispatch`等快捷方法，下面展示如何使用一个model

```jsx
import React, {Component} from 'react';
import ProductsModel from '../models/ProductsModel'
import controller, {requireModel} from 'symphony-joy/controller'


@requireModel(ProductsModel)  // register model
@controller((state) => {
  return {
    products: state.products.products // read model's state
  }
})
export default class IndexController extends Component {

  async componentPrepare() {
    let {dispatch} = this.props;
    // invoke model's method
    await dispatch({
      type: 'products/getProducts',  // namespace/methodname 
      pageIndex: 1,
      pageSize: 5,
    });
  }

  render() {
    let {products = []} = this.props;
    return (
      <div >
        <div>PRODUCTS</div>
        <div>
          {products.map((p, i) => {
            return <div key={p.id}>{p.id}:{p.name}</div>
          })}
        </div>
      </div>
    );
  }
}

```

1. 注册model，`@requireModel(ModelClass)`注册Controller需要依赖的Model，通常只需要在model的入口Controller上注册一次，重复注册无效。
2. 获取model的状态， 只有controller类型的Component才能绑定Model中的状态，在使用`@controller(mapStateToProps)`声明Controller时，第一个参数`mapStateToProps`是一个回调函数，回调函数参数`state`为store的整个状态，使用`state[namespace]`来获取特定model的状态。
3. 调用model的方法， `store.dispatch(action)`发送action对象到model的方法中，action对象中的type属性格式为`namespace/methodname`，`namespace`为Model类中定义的namespace，`methodname`是Model类中定义的方法名称，action对象中同样可以包含其它业务参数， 例如上面例子中的`pageIndex`。

#### Model API

##### namespace

model将会被注册到store中，由store统一管理model，在store中不能存在两个相同的`namespace`的model。

##### initState

在创建新的store时，作为store的初始状态，在之后的model的运行过程中使用的是store中对应的state， 所以请勿直接使用`model.state`来获取和更新model的状态，提供了`setState(nextState)`和`getState()`方法来操控state。

##### setState(nextState)

`setState(nextState)`更新model的状态，`nextState`是可以是当前model状态的一个子集，内部将使用浅拷贝的方式合并当前的状态，并更新store的state。

##### getState

`getState()`获取当前model的状态，`async`函数运行中，store的状态可能已经发生了改变，可使用该方法，获取最新状态。

##### getStoreState()

`getStoreState(）`获取当前store的状态，和`getState()`方法类似。

##### dispatch(action)

和redux的`store.dispatch(action)`的使用一样，我们可以通过该方法发送一个普通action对象到store。

#### Dva Model

我们同时兼容dva风格的model对象，使用方法和上面一样，model对象的定义请参考 [Dva Concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts_zh-CN.md) ;






### Router

使用方法请参考：[react-router-4](https://reacttraining.com/react-router/web/guides/philosophy)

 > 我们并未对react-router-4做任何的修改，仅仅只是封装了一个外壳，方便统一导入和调用。
 
 ```jsx
 import {Switch, Route} from 'symphony-joy/router'
 ```
 








## TODO

- 完善使用文档
- 添加例子和测试案例
