# 路由

## 约定式路由

约定式路由也叫文件路由，不需要手写路由配置，文件系统即路由，通过目录和文件及其命名分析出路由配置。

约定路由的存放目录`src/client/pages`或者`src/pages`，如果`src/client/pages`存在，就不会再分析`src/pages`中的路由了。
例如：

```shell
myapp
  src
    client
      pages  # 约定路由根目录
        index.tsx  # 首页
        about.tsx  # 关于页面
```

等效于以下路由配置：

```js
[
  { exact: true, path: "/", providerName: "index", providerModule: "src/client/pages/index" },
  { exact: true, path: "/", providerName: "about", providerModule: require("src/client/pages/about") },
];
```
