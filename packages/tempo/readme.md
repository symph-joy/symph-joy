# @symph/tempo

`@symph/tempo`是一个 React 应用的轻量框架，基于 redux，简化了 redux 的使用及其复杂的概念，采用 MVC 的思想使代码和应用结构更加清晰，从而可以轻松高效的开发。

该框架只提供 MVC 组件支持，并不包含路由和构建相关的模块，这样可以更方便的集成到其它框架中（[create-react-app](https://github.com/facebook/create-react-app)、react-native 等）。如果你想要一个全栈的高可用框架，来帮你解决各种技术细节，快速的进入业务开发，请关注 [`@symph/joy`](https://github.com/lnlfps/symph-joy) 项目，它基于本项目，为开发提供更全面的项目能力。

## 安装

```bash
yarn add @symph/tempo
```

或者

```bash
npm install --save @symph/tempo
```

## 例子

> [with-create-react-app](https://github.com/lnlfps/symph-tempo/tree/master/examples/with-create-react-app) 使用[create-react-app](https://github.com/facebook/create-react-app)创建空白工程，并集成`@symph/tempo`

## 初始化框架

```javascript
import React, { Component } from "react";
import { create } from "@symph/tempo";
import { Provider } from "@symph/tempo/provider";

// 创建框架实例，然后就可以使用Controller和Model组件了
const app = create(
  {
    initialState: {},
  },
  {
    initialReducer: {},
    setupMiddlewares: (middlewares) => {
      return middlewares;
    },
  }
);
// 启动框架
app.start();

// 在React绑定
class App extends Component {
  render() {
    return (
      <Provider app={app}>
        <div> you app content </div>
      </Provider>
    );
  }
}

export default App;
```

## 创建 MVC 组件

- Model: 管理应用的行为和数据，普通 class 类，有初始状态，业务运行中更新 model 状态
- View: 展示数据，继承 React.Component
- Controller: 控制 View 的展示，绑定 Model 数据到 View，响应用户的操作，调用 Model 中的业务, 继承于 React.Component

组件间工作流程图

![app work flow](https://github.com/lnlfps/static/blob/master/symphony-joy/images/app-work-flow.jpeg?raw=true)

图中蓝色的箭头表示数据流的方向，红色箭头表示控制流的方向，他们都是单向流，store 中的`state`对象是不可修改其内部值的，状态发生改变后，都会生成一个新的 state 对象，且只将有变化的部分更新到界面上，这和[redux](https://redux.js.org/)的工作流程是一致的。

> 这里只是对 redux 进行 MVC 层面的封装，并未添加新的技术，依然可以使用 redux 的原生接口，如果想深入了解 redux，请阅读其详细文档：[redux](https://redux.js.org/)

### 创建 Model

Model 管理应用的行为和数据，Model 拥有初始状态`initState`和更新状态的方法`setState(nextState)`，这和 Component 的 state 概念类似，业务在执行的过程中，不断更新`state`，当`state`发生改变时，和`state`绑定的 View 也会动态的更新。这里并没有什么魔法和创造新的东西，只是将 redux 的`action`、`actionCreator`、`reducer`、`thunk`、`saga`等复杂概念简化为业务方法和业务数据两个概念，让我们更专注于业务实现，代码也更简洁.

创建一个计数器 Model，计数器默认数值为 0，还有一个增加计数的方法。

```javascript
// models/CalculateModel.js
import model from "@symph/tempo/model";

@model()
export default class CalculateModel {
  //model的唯一标识，通过该名称来访问model中的状态数据
  namespace = "calculate";

  //初始状态数据
  initState = {
    counter: 0,
  };

  async add({ number }) {
    let { counter } = this.getState();
    counter += number;
    // 更新model中的状态
    this.setState({
      counter,
    });
  }
}
```

我们使用`@model()`将一个类声明为 Model 类，Model 类在实例化的时候会添加`getState`、`setState`，`dispatch`等快捷方法。

#### Model API

##### namespace

model 将会被注册到 redux store 中，由 store 统一管理 model 的状态，使用`store.getState()[namespace]`来访问对应 model 的 state, store 中不能存在两个相同的`namespace`的 model。

##### initState

设置 model 的初始化状态，由于`model.state`可能会被多个`async`业务方法同时操作，所以为了保证 state 的有效性，请在需要使用 state 时使用`getState()`来获取当前 state 的最新值，并使用`setState(nextState)`方法更新当前的 state。

##### setState(nextState)

`setState(nextState)`更新 model 的状态，`nextState`是当前 state 的一个子集，系统将使用浅拷贝的方式合并当前的状态。

##### getState()

`getState()`获取当前 model 的状态。

##### getStoreState()

`getStoreState(）`获取当前整个 store 的状态。

##### dispatch(action)

返回值：Promise，被调用业务的返回值。

在 model 中使用`await this.dispatch(action)`调用其它业务方法，这和 redux 的`store.dispatch(action)`的使用一样，由系统分发`action`到指定的 model 业务方法中, `action.type`的格式为`modelNamespace/serviceFunction`。

如果是调用 model 自身的业务方法，可以使用`await this.otherService({option})`的方式，`this`指的是 model 本身。

#### 业务方法

`async service(action)` 业务方法是`async`函数，内部支持`await`指令调用其它异步方法。在 controller 或者其他 model 中通过`dispatch(action)`方法调用业务方法并获得其返回值。

#### Dva Model

兼容 dva 风格的 model 对象，使用方法：[Dva Concepts](https://github.com/dvajs/dva/blob/master/docs/Concepts_zh-CN.md) ;

### 创建 Controller

Controller 需要申明其依赖哪些 Model，以及绑定 Model 的中的数据，和调用 Model 中的业务方法。它是一个 React 组件，可以像其它 React 组件一样创建和使用。

下面创建一个计数器 Controller，展示 Model 中存储的统计值，以及调用 Model 中的方法来修改统计值。

```javascript
// models/CalculateController.js
import React, { Component } from "react";
import { controller, requireModel } from "@symph/tempo/controller";
import CalculateModel from "../models/CalculateModel";

@requireModel(CalculateModel)
@controller((state) => {
  // 绑定calculateModel中的状态到当前组件
  return {
    counter: state.calculate.counter, // bind model's state to props
  };
})
export default class CalculateController extends Component {
  add = async () => {
    let { dispatch } = this.props;
    // 调用calculateModel中的业务方法
    await dispatch({
      type: "calculate/add",
      number: 1,
    });
  };

  render() {
    let { counter } = this.props;
    return (
      <div>
        <div>counter: {counter}</div>
        <button onClick={this.add}>add 1</button>
      </div>
    );
  }
}
```

创建和使用 Controller 的步骤：

- 使用`@controller(mapStateToProps)`装饰器将一个普通的 Component 声明为一个 Controller，参数`mapStateToProps`实现 model 状态和组件 props 属性绑定，当 model 的 state 发生改变时，会触发组件使用新数据重新渲染界面。

- 使用`@requireModel(ModelClass)`注册 controller 需要依赖的 model，这样可以将 controller 依赖的 model 打包到一个 thunk 中，只有在 controller 运行时，才会去加载依赖的 model，通常只需要在第一次使用到 model 的时候加载一次即可，无需重复注册。

- 每个 controller 的`props`都会被注入一个 redux 的`dispatch`方法，`dispatch`方法是 controller 调用 model 的唯一途径，该方法的返回值是业务方法的返回值(Promise 对象)，这和 redux 的 dispatch 方法有差别。

如果项目的 babel 配置还不支持`@`装饰器语法，请使用函数调用的方式来声明 Controller，例如：

```javascript
// models/CalculateController.js
import React, { Component } from "react";
import { controller, requireModel } from "@symph/tempo/controller";
import CalculateModel from "../models/CalculateModel";

class CalculateController extends Component {
  add = async () => {
    let { dispatch } = this.props;
    // 调用calculateModel中的业务方法
    await dispatch({
      type: "calculate/add",
      number: 1,
    });
  };

  render() {
    let { counter } = this.props;
    return (
      <div>
        <div>counter: {counter}</div>
        <button onClick={this.add}>add 1</button>
      </div>
    );
  }
}

const Controller = controller((state) => {
  // 绑定calculateModel中的状态到当前组件
  return {
    counter: state.calculate.counter, // bind model's state to props
  };
})(CalculateController);
const ModelBound = requireModel(CalculateModel)(Controller);
export default ModelBound;
```

### 创建 View

View 是一个普通的 React 组件，其只负责界面展示，展示的数据来自父组件，通过`this.props`属性读取。

```javascript
import React, { Component } from "react";

class TextView extends Component {
  render() {
    let { message } = this.props;
    return <div>{message}</div>;
  }
}
```
