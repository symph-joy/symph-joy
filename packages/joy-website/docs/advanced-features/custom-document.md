# 自定义 Document

`Document` React 组件用于生成页面的`<html>`和`<body>`标签， Joy 会根据应用内的组件和样式，自动生成必须的 js 和 css 标签，保证页面 html 能够正常被加载。
我们可以通过自定义`Document`在`<html>`加入自定义的扩展`<head>`、`<link>`或者`<sciprt>`。

覆盖默认的`Document`，创建文件`./src/pages/_document.tsx`并修改`Document`如下：

```tsx
import React from "react";
import Document, { Html, Head, Main, JoyScript, DocumentContext } from "@symph/joy/document";

export default class MyDocument extends Document<any> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head></Head>
        <body>
          <Main />
          <JoyScript />
        </body>
      </Html>
    );
  }
}
```

> 上面示例中的`MyDocument`，等效于 Joy 默认的`Document`，未加入自定义的内容，如果不需要`getInitialProps`或者`render`方法，可以删除掉。

`Html`、`Head`、`Main`和`JoyScript`是页面必须的，在自定义的`Document`类中，不要删除它们和更改顺序。
但它们支持一些自定义的属性，例如：

```tsx
<Html lang="en">
```

这里的`<Head />`不同于`@symph/joy/react`中的`Head`组件，这里的`<Head />`用于定义在所有页面中共有的`<head>`元素，而其它的，例如`<title>`标签，建议在页面组件中使用`@symph/joy/react`中的`Head`组件来定义。

`getInitialProps`方法返回`Document`组件的初始 props，参数`ctx: DocumentContext`具有以下属性：

- `pathname`：`string`，当前渲染的页面路径。
- `query`： `object`， url 中的请求参数被解析后的对象。
- `req`：[`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage), 触发当前渲染的请求对象。
- `res`：[`ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse), 触发当前渲染的请求的响应对象。
- `err` ：Error, 在渲染阶段出现的异常。
- `renderPage`: `functin` 将`App`渲染为 html 字符串，返回值`{html, head}`在服务端渲染时。

## 注意事项

- `Document`只在服务端被渲染，事件处理并不会触发执行，例如`onClick`事件。同理 React 的部分生命周期也不会执行，例如`onComponentDidMount`。
- 在`<Main/>`之外的 React 组件并不会被浏览器初始化，所以不要在这里添加任何业务逻辑。如果需要给整个应用添加统一的组件，可以在根布局组件中添加，或者`App`中添加。
