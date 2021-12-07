
# [@symph/joy](https://lnlfps.github.io/symph-joy)

## 介绍

官网：[https://lnlfps.github.io/symph-joy](https://lnlfps.github.io/symph-joy)

@symph/joy让我们轻松的进行前端应用开发，零配置可用，简单清晰的业务和数据管理模块，已集成大量最佳实践的优化方案，即使你才刚接触React，也可以轻松创建高可用、可维护的前端应用。

> 该项目已在生产环境大量使用，如有任何疑问、使用帮助、bug反馈、特性讨论，请和我们联系(邮件：lnlfps@gmail.com; QQ群：929743297)，或者到github创建issue，欢迎加入。

## 特征

- 零配置可用，优化的默认配置，快速开发，已集成react、redux、react-router4和ES6、7语法支持等
- 支持服务端渲染，在业务组件内部获取渲染数据，组件内聚更高，便于维护
- MVC架构，模块化设计，简化redux的学习和使用
- 依赖自动注入，专注组件内部实现，依赖关系更明确，方便调用
- 支持`@`装饰器将普通Class申明为Controller或Model等，不侵入业务代码
- 支持react hook模式开发函数式组件，轻松链接Model管理业务流程
- 全局支持async语法，复杂的业务逻辑也能轻松找到解决方案
- 支持静态版本导出，脱离Node.js运行，也可单独导出静态页面
- 内置网络请求代理服务，解决跨域和服务中转问题，前后端分离开发畅通无阻
- 支持插件化配置，便于功能扩展

## 安装和开始

运行`npm init`创建一个空工程，并填写项目的基本信息，当然也可以在一个已有的项目中直接安装。

```bash
npm install --save  @symph/joy react react-dom
```

> @symph/joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html)及以上版本

添加NPM脚本到package.json文件：

```json
{
  "scripts": {
    "dev": "joy dev"
  }
}
```

然后就可以开始正式工作了，下面从`hello world`示例开始，首先编写一个Model组件来管理应用的数据和业务。

```javascript
// /src/models/HelloModel.js

import model from '@symph/joy/model'

@model() // 标明这是一个Model。
export default class HelloModel {
  namespace = 'hello'
  
  // model的初始状态数据
  initState = {
    message: 'Welcome to @symph/joy!'
  }
  
  // async业务方法，从服务端异步获取新的欢迎消息
  async fetchMessage () {
    let newMsg = await fetch('/hello_message');
    //更新model的状态，界面的状态也会自动更新
    this.setState({
      message: newMsg
    });
  }
 
}
```

接下来编写界面，展示欢迎消息。`@symph/joy`默认使用`/src/index.js`文件作为应用的启动入口组件，可以在这里初始化基础功能模块和设置子页面路由等。

```javascript
// /src/index.js
import React, { Component } from 'react'
import {controller, autowire } from '@symph/joy/controller'
import HelloModel from './models/HelloModel'


@controller((store) => {             // 标明这是一个Controller
  return {
    message: store.hello.message,    // 绑定model中的数据
  }
})
export default class ThirdHelloController extends Component {

  @autowire()                       // 声明依赖的Model
  helloModel: HelloModel      
  
  async componentDidMount() {
    await this.helloModel.fetchMessage() //调用model
  }
  
  render(){
    return <div>${this.props.message}</div>
  }
}
```

最后运行`npm run dev`命令，在浏览器中输入访问地址`http://localhost:3000`，即可看到刚才写的页面。如果需要使用其它端口来启动应用 `npm run dev -- -p <your port here>`

到目前为止，一个简单完整的前端应用已经创建完成，可以开始工作了。还有很多神奇的特性，请查看 [详细使用指南](https://lnlfps.github.io/symph-joy/#/getting-started)

## 文档

[https://lnlfps.github.io/symph-joy](https://lnlfps.github.io/symph-joy)

快速连接：

- [使用指南](https://lnlfps.github.io/symph-joy/#/getting-started)
- [配置文档](https://lnlfps.github.io/symph-joy/#/configurations)
- [插件列表](https://lnlfps.github.io/symph-joy/#/plugins)
- [升级日志](https://lnlfps.github.io/symph-joy/#/change-log)

## 联系我们

邮件：lnlfps@gmail.com
QQ群：929743297
