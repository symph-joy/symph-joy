
# 主要版本升级日志

## 1.2.3

- 重构api代理模式，支持特定路径代理转发，支持websocket转发。
- fetch文件优化，自动代理模式优化。
- bug 修复。

## 1.2.0

- 支持react hook。提供hook和model链接
- 升级了各主要依赖库
- fix: react-hot-loader 热更新时componentPrepare被重复调用
- fix: n个常规问题

## 0.5.0

- 优化webpack配置，使其更适合单页渐进式应用，减少首屏js加载大小。将`_app.js` `_error.js` `runtime/webapck.[hash].js`合并到`main.js`中
- 优化@symph/joy-css和@symph/joy-less插件，优化后：`styles.css`添加hash标识，有效利用缓存；自动注入到document中，不再需要自定义`_document.js`
- 去掉react-router-redux@5.0.0-alpha.9, 该插件已停止更新，并会导致生产包运行错误，替换为的connected-react-router
- 去掉从next.js继承过来的pages目录，将`pages/_document.js`移动到`src/_document.js`，简化项目目录结构
- fix: 服务端渲染时，所有在chunks在首页就被全部加载
- fix: build时出现`id not found``错误，升级webpack到4.18.0
- example: 添加集成antd的例子

