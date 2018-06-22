
# 快速上手

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


