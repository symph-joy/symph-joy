# 主要版本升级日志

## 1.2.3

- 重构 api 代理模式，支持特定路径代理转发，支持 websocket 转发。
- fetch 文件优化，自动代理模式优化。
- bug 修复。

## 1.2.0

- 支持 react hook。提供 hook 和 model 链接
- 升级了各主要依赖库
- fix: react-hot-loader 热更新时 componentPrepare 被重复调用
- fix: n 个常规问题

## 0.5.0

- 优化 webpack 配置，使其更适合单页渐进式应用，减少首屏 js 加载大小。将`_app.js` `_error.js` `runtime/webapck.[hash].js`合并到`main.js`中
- 优化@symph/joy-css 和@symph/joy-less 插件，优化后：`styles.css`添加 hash 标识，有效利用缓存；自动注入到 document 中，不再需要自定义`_document.js`
- 去掉 react-router-redux@5.0.0-alpha.9, 该插件已停止更新，并会导致生产包运行错误，替换为的 connected-react-router
- 去掉从 next.js 继承过来的 pages 目录，将`pages/_document.js`移动到`src/_document.js`，简化项目目录结构
- fix: 服务端渲染时，所有在 chunks 在首页就被全部加载
- fix: build 时出现`id not found``错误，升级 webpack 到 4.18.0
- example: 添加集成 antd 的例子
