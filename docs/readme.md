
# [@symph/joy](https://lnlfps.github.io/symph-joy)

## 介绍

[https://lnlfps.github.io/symph-joy](https://lnlfps.github.io/symph-joy)

@symph/joy让我们轻松的进行前端应用开发，无需复杂的配置，清晰的业务和数据管理，已集成大量的前端最佳实践和优化方案，即使你才刚接触React，也可以轻松创建高可用、可维护的前端应用。

> 该项目已在生产环境大量使用，如有任何疑问、使用帮助、bug反馈、特性讨论，请和我们联系(邮件：lnlfps@gmail.com; QQ群：929743297)，或者到github创建issue，欢迎加入。

## 特征

- 零配置可用，优化的默认配置，快速开发，已集成react、redux、react-router4和ES6、7语法支持等
- 支持服务端渲染，只需在Component中添加[`async componentPrepare()`](https://lnlfps.github.io/symph-joy/#/getting-started?id=controller)一个方法来获取数据
- 支持静态版本导出，脱离Node.js运行，也可单独导出静态页面
- 使用MVC架构，应用结构清晰、依赖明确，创新式的Model类简化业务方法和数据管理
- 支持aync语法来编排业务，监听业务执行结果
- 使用`@`装饰器的方式，动态注册model和controller，不侵入业务代码
- 内置业务请求代理服务，解决跨域和服务中转问题，前后端分离开发畅通无阻
- 支持插件化配置

## 安装和开始

运行`yarn init`创建一个空工程，并填写项目的基本信息，当然也可以在一个已有的项目中直接安装。

```bash
yarn add  @symph/joy react react-dom
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

然后就可以开始正式工作了，创建`./src/index.js`文件，编写第一个功能组件：

```jsx
export default () => <div>Welcome to @symph/joy!</div>
```

最后运行`yarn run dev`命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `yarn run dev -- -p <your port here>`

到目前为止，一个简单完整的前端已经创建完成，还有更多的让人惊讶的特性，等着你发现，请查看 [详细使用指南](https://lnlfps.github.io/symph-joy/#/getting-started)

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
