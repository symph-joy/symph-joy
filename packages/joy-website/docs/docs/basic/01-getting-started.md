# 快速开始

Joy 支持 React、Node 或者前后端混合应用开发，这里以一个简单的 React 应用为例，介绍如何快速开始开发。

## 环境准备

- node 建议 12 或以上版本，推荐使用 nvm 来管理 node 版本。

- 推荐使用 yarn 管理依赖，国内使用 [阿里 npm 源](https://npmmirror.com/) registry: https://registry.npm.taobao.org

```shell
# 安装 yarn
$ npm i yarn -g
# 手动设置`registry`地址为国内源
$ yarn config set registry https://registry.npm.taobao.org
# 查看源
$ yarn config get registry

# 或者使用 tyarn
$ npm i yarn tyarn -g
# 后面文档里的 yarn 换成 tyarn
$ tyarn -v
```

## 创建目录

创建应用根目录

```shell
$ mkdir myapp && cd myapp
```

创建应用内目录和文件，目录结构如下：

```shell
myapp
  src  # 源代码目录
    pages  # 约定React路由目录
      index.tsx  # 第一个页面
  package.json
```

- 在 package.json 内声明应用名和依赖：

```json
{
  "name": "myapp",
  "version": "v1.0.0",
  "scripts": {
    "dev": "joy dev",
    "export": "joy build&&joy export"
  },
  "dependencies": {
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "@symph/joy": "^2.0.0"
  }
}
```

- 创建第一个路由页面`index.tsx`, Joy 同时支持 ES6 和 Typescript 语法，如果使用 ES6，创建 JS 文件`index.jsx`，添加页面展现内容:

```tsx
// src/pages/index.tsx
import React from "react";
import { ReactController, BaseReactController } from "@symph/react";

@ReactController()
export default class Index extends BaseReactController {
  renderView() {
    return <p>Hello Joy!</p>;
  }
}
```

## 安装依赖

```shell
$ yarn install
```

## 启动开发服务器

```shell
$ yarn dev
```

当命令行输出`ready - started server on http://localhost:3000`时，开发服务器启动成功，打开浏览器输入地址 `http://localhost:3000`，即可看到我们的第一个页面`Hello Joy!`。
若此时修改页面内容`Hello Joy!`为`Hello MyApp`，然后保存文件，浏览器界面将自动更新为新内容。

## 部署发布

### 构建

```shell
$ yarn export
```

构建产物默认生成到 ./out 下，目录结构类似于：

```shell
./out
index.html
404.html
_joy/ # 包含js、css、json等
```

### 本地验证

使用`http-server`启动本地静态文件服务器

```shell
# 安装 http-server
$ npm i -g http-server

# 启动服务器
$ http-server ./out
```

在浏览器上打开地址：[http://127.0.0.1:8080](http://127.0.0.1:8080), 正常情况下应该是和`yarn dev`开发运行时是一致的。

### 部署

本地验证完成后，将`out`目录部署到服务器上即可。
