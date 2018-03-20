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

## 使用方法

### 安装

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

然后运行`symphony` 命令，在浏览器中输入http://localhost:3000可以访问刚才添加的页面。如果使用其它端口来启动应用，可使用`symphony dev -p <your port here>`

到目前为止，一个简单可完整运行的react app已经创建完成，例子 [hello-world](./examples/hello)， 那我们拥有了什么呢？

- 一个应用入口（`./src/index.js`），我们可以在里面完善我们的app内容和添加路由（参考[react-router-4](https://reacttraining.com/react-router/web/guides/philosophy)的使用方法）
- 启动了一个开发服务器，可以访问我们编写的界面了
- 一个零配置的webpack编译器，监控我们的源码，并实时编译为在服务端和浏览器运行的js。
- 热加载，如果我们修改了`./src/index.js`的内容并保存，界面会自动刷新
- 静态资源服务，在`/static/`目录下的静态资源，可通过`http://localhost:3000/static/`访问


### 样式 CSS

#### jsx内建样式

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



## TODO

- 完善使用文档
- 添加例子和测试案例





   


