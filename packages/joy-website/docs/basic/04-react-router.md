# React 路由

Joy React 应用是单页面应用(SPA)，单页面应用是加载单个 HTML 页面并在用户与应用程序交互时动态的更新该页面，而更新工作就由路由模块来完成，不同的页面由不同的的组件构成，页面切换也就是组件的切换。

> 路由模块底层封装自 [react router](https://reactrouter.com/)，其核心概念和用法可以兼容，我们可以直接采用 react router 官方文档中描述的方法来定义路由。

## 路由组件

使用`@Route`装饰器将`ReactController`申明为一个路由组件，路由组件在 Joy 启动时将被自动扫描和加载。
即创建`src/client/pages/hello.tsx`文件，启动`joy dev`，浏览`http://localhost:300/hello` 即可访问到我们的页面。

```tsx
// src/client/pages/hello.tsx

import React from "react";
import { ReactController, BaseReactController, Route } from "@symph/react";

@Route({ path: "/hello" })
@ReactController()
export default class HelloController extends BaseReactController {
  renderView() {
    return <div data-testid="hello">Hello</div>;
  }
}
```

等效于以下路由配置：

```js
[{ exact: true, path: "/hello", providerName: "helloController", providerModule: "src/client/pages/hello.tsx" }]``;
```

### 路由组件参数

#### path

Type: `string`

能匹配本组件的路由路径，其配置方法需满足 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 规则。

#### exact

Type: `boolean | undefined`, Default：`true`

是否严格匹配路由路径，即路由和
