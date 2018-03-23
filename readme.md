# symphony-joy

symphony-joy 的目标是创建极致开发和用户体验的 React 应用，灵感来自于Next.js和Dva等优秀的开源库，在此非常感谢以上开源贡献者的辛勤付出。


## 特征

以下特征功能均可零配置实现, symphony-joy默认为应用良好运行提供了默认配置，当然可以定制配置。
 
- 自动编译和打包源码（使用webpack和babel）
- 服务端数据获取和渲染， 解决首屏加载速度、页面静态化、SEO等问题
- 代码热加载，便于开发调试
- 按需加载，提升页面加载效率
- 使用Model类管理redux 的action、state、reducer部件，代码结构和业务逻辑更清晰
- 支持插件化配置，兼容next.js的大部分插件。


## 安装

运行`npm init`创建一个空工程，并填写项目的基本信息，当然也可以在一个已有的项目中直接安装。

```bash
npm install --save symphony-joy react react-dom
```
> symphony-joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html).<br/>

创建`./src/index.js`文件，并插入以下代码：

```jsx
import React, {Component} from 'react'

export default class Index extends Component{
  render(){
    return <div>Welcome to symphony joy!</div>
  }
}
```

然后运行`symphony` 命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `symphony dev -p <your port here>`

到目前为止，一个简单可完整运行的react app已经创建完成，例子 [hello-world](./examples/hello)， 那我们拥有了什么呢？

- 一个应用入口（`./src/index.js`），我们可以在里面完善我们的app内容和添加路由（参考[react-router-4](https://reacttraining.com/react-router/web/guides/philosophy)的使用方法）
- 启动了一个开发服务器，可以访问我们编写的界面了
- 一个零配置的webpack编译器，监控我们的源码，并实时编译为在服务端和浏览器运行的js。
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

为了支持导入css、less和sass样式文件，可使用next.js的兼容插件，具体使用方法请见插件详情页面。

- [@zeit/next-css](https://github.com/zeit/next-plugins/tree/master/packages/next-css)
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
import Controller from 'symphony-joy/controller'

@Controller((state) => ({
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

```jsx
export default {

  namespace: 'user',

  state: {
    me: null,
  },

  subscriptions: {
      setup({ dispatch, history }) {  // eslint-disable-line
      },
  },

  effects: {
    *fetchMyInfo({ payload }, { call, put }) {  // eslint-disable-line
      let me = yield new Promise((resolve, reject)=>{
        setTimeout(()=>{
          resolve({
              id: 1,
              name:'lane lee',
              age: 18,
            })
        }, 100);
      });
      yield put({ type: 'save', payload: {me}});
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
```


### Router

```jsx
import {Switch, Route} from 'symphony-joy/router'
```

使用方法请参考：[react-router-4](https://reacttraining.com/react-router/web/guides/philosophy)

 > 我们并未对react-router-4做任何的修改，仅仅只是封装了一个外壳，方便统一导入和调用。
 







## TODO

- 完善使用文档
- 添加例子和测试案例
