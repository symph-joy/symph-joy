
# [@symph/joy](https://lnlfps.github.io/symph-joy)

## 介绍

[https://lnlfps.github.io/symph-joy](https://lnlfps.github.io/symph-joy)

@symph/joy的目标是创建愉悦的前端应用，拥有了[next.js](https://github.com/zeit/next.js)的服务端渲染和零配置能力，也能像[dva](https://github.com/dvajs/dva)一样轻松的开发前端业务。

> 该项目已在生产环境使用，如有任何疑问、使用帮助、bug反馈、特性讨论，请联系我们，或者到github创建issue，也非常欢迎加入我们。

## 特征

- 零配置可用，快速开发，已集成react、redux、react-router4和ES6、7语法支持等
- 支持服务端渲染，只需在Component中添加[`async componentPrepare()`](https://lnlfps.github.io/symph-joy/#/getting-started?id=controller)一个方法来获取数据
- 支持静态版本导出，脱离Node.js运行，也可单独导出静态页面
- 使用MVC架构，组件结构清晰、依赖明确
- 支持aync语法来编排业务，监听业务执行结果
- 使用`@`装饰器的方式，动态注册model和controller，不侵入业务代码
- 内置跨域请求转发服务，在Node.js服务端的支持下，不再困扰跨域问题
- 支持插件化配置

## 安装和开始

运行`yarn init`创建一个空工程，并填写项目的基本信息，当然也可以在一个已有的项目中直接安装。

```bash
yarn install --save @symph/joy react react-dom
```

> @symph/joy 只支持 [React 16](https://reactjs.org/blog/2017/09/26/react-v16.0.html)及以上版本

添加NPM脚本到package.json文件：

```json
{
  "scripts": {
    "dev": "joy",
    "build": "joy build",
    "start": "joy start"
  }
}
```

然后就可以开始你的开发工作了，创建`./src/index.js`文件，并插入以下代码：

```jsx
export default () => <div>Welcome to @symph/joy!</div>
```

最后运行`yarn run dev`命令，在浏览器中输入访问地址`http://localhost:3000`。如果需要使用其它端口来启动应用 `yarn run dev -- -p <your port here>`

到目前为止，一个简单完整的react app已经创建完成.

## 文档

[https://lnlfps.github.io/symph-joy](https://lnlfps.github.io/symph-joy)

快速连接：

- [使用指南](https://lnlfps.github.io/symph-joy/#/getting-started)
- [配置文档](https://lnlfps.github.io/symph-joy/#/configurations)
- [插件列表](https://lnlfps.github.io/symph-joy/#/plugins)

## 联系我们

邮件：lnlfps@gmail.com
