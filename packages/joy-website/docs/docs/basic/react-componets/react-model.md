# ReactModel

ReactModel 组件用于管理业务行为和维护业务数据状态。

状态管理基于 [redux](https://redux.js.org/) 实现，秉承其单向不可变数据流，全局状态管理属性的特性，各个 Model 的状态统一在 Redux 的 `store`中管理，Model 实例上并未正真保存状态数据，读取 Model 状态时，实时从全局状态中获取属于当前 Model 的状态。

`ReactModel`是单例且按需加载和创建的，在应用运行期间，只有当前界面上使用到的`ReactModel`组件才会被创建，创建后的实例将一直在容器中存在，如果再次进入该界面，会直接使用之前的实例和其状态渲染。

先看一个简单的购物车 Model 示例：

```ts
import { BaseReactModel, ReactModel } from "@symph/react";
import { Inject } from "@symph/core";

interface Order {
  id: string;
  name: string;
  price: number;
}

interface OrderModelState {
  orders: Order[];
}

@ReactModel()
export class OrderModel extends BaseReactModel<OrderModelState> {
  // 设置初始化状态
  getInitState(): OrderModelState {
    return { orders: [] };
  }

  async fetchOrders() {
    const resp = await this.fetchService.fetchApi("/orders");
    const orders = await resp.json();
    this.setState({ orders }); // 更新状态
  }
}
```

`OrderModel`继承了`BaseReactModel`类，使用`@ReactModel(options)` 装饰器申明这个是一个 ReactModel，通过泛型指定了其管理的`state`的数据类型。

## 设置初始状态 `getInitState`

在`ReactModel`类中实现`getInitState`方法，其返回值即作为该 Model 的初始状态值。

只有在 `ReactModel` 首次被创建时，才会向统一状态源中注册该 Model 的和其初始状态值。

## 更新状态 `setState`

在业务方法内部，调用父类提供的`protected setState(nextState: Partial<TState>): void`方法来更新当前 Model 状态。

入参`nextState`可以是该 Model 状态的一部分值，最终和当前状态`merge`合并后形成新的状态，合并只是浅层合并，类似`Object.assign({}, nextState, curState)`, 和这和 React 类组件提供的`setState`方法类似。

其访问属性为`protected`，意为着只能在本 Model 内部调用，不能在外部直接调用更改一个 Model 的状态，也不建议这样，这会导致 Model 的状态难以维护。

## 读取状态 `state`

在 Model 内部和外部可通过读取`public get state(): TState；`属性来获取 Model 的当前状态，这是一个`getter`方法申明的只读属性，每次读取该属性，都会从统一数据源中获取新的当前状态值。

当`ReactController`依赖注入了`ReactModel`实例，在渲染阶段并读取和使用了其 **部分** 状态，那么就只和这 **部分** 状态建立了绑定关系，当这 **部分** 状态发现变化时，界面才会重新渲染，而其它 **未使用部分** 状态发现更新，界面不会重新渲染，这能明显减少 React 的重新渲染次数，提升运行效率和界面流畅度。

例如：

```ts
@ReactModel()
export class UserModel extends BaseReactModel<{
  userName: string;
  phoneNumber: string;
}> {
  // 设置初始化状态
  getInitState(): OrderModelState {
    return {};
  }

  public updateUser({ userName, phoneNumber }) {
    this.setState({ userName, phoneNumber });
  }
}
```

```tsx
@ReactController()
export default class PhoneController extends BaseReactController {
  @Inject()
  private userModel: UserModel;

  updatePhoneNumber = () => {
    const { userName, phoneNumber } = this.userModel.state;
    this.userModel.updateUser({ userName, phoneNumber: "00000000" });
  };

  renderView(): ReactNode {
    // 只使用了 UserModel 中的 phoneNumber 属性，未使用 userName 属性
    const { phoneNumber } = this.userModel.state;
    return (
      <div>
        <span>Phone Number: {phoneNumber} </span>
        <button onClick={this.updatePhoneNumber}>edit</button>
      </div>
    );
  }
}
```

上示例中:

- 在`PhoneController`的渲染方法中，只使用了`UserModel`状态的`phoneNumber`属性，未使用`name`属性，所以只有当`phoneNumber`状态发现变化时，`PhoneController`才会触发重新渲染。
- 在 `updatePhone` 中虽然 `userName` 和 `phoneNumber`都使用了，但不是在渲染阶段使用的，所以`userName`并不会和界面建立绑定关系。

## 避免状态过期

ReactModel 中对应的状态是不可变的，每次更新状态，都会创建一个新的状态，所以每次中获取的状态只能代表当前状态，如赋值语句`const user = userModel.state;`中的`user`只是当前的状态的快照，如果立即更改了`userModel`的状态，`user`变量并不会同步更新，**所以** 在需要时应当重新获取当前状态。

例如我们尝试给指定用户发送短信，但是发送之前，需要用户确认个人信息是否正确：

```tsx
@ReactController()
export default class PhoneController extends BaseReactController {
  @Inject()
  private userModel: UserModel;

  sendMessage = async () => {
    const user = this.userModel.state;
    await this.confirmPhone(user); // 异步执行语句
    // 错误: import! 不能直接再使用user.phoneNumber了，因为可能已经被用户修改了。
    this.userModel.sendSMS({ phoneNumber: user.phoneNumber, smsContext: `Hello ${userName}!` });

    // 正确：应该重新获取当前的状态。
    const confirmedUser = this.userModel.state;
    this.userModel.sendSMS({ phoneNumber: confirmedUser.phoneNumber, smsContext: `Hello ${userName}!` });
  };

  confirmPhone = async () => {
    /********
     * 在这里弹出用户信息确认框。
     * 如果信息有误，用户可以立即编辑更新用户信息。
     ******/
  };

  renderView(): ReactNode {
    // 只使用了 UserModel 中的 phoneNumber 属性，未使用 userName 属性
    const { phoneNumber } = this.userModel.state;
    return (
      <div>
        <span>Phone Number: {phoneNumber} </span>
        <button onClick={this.sendMessage}>Send Hell Message</button>
      </div>
    );
  }
}
```

## 数据获取服务 ReactFetchService

数据获取基本上是每个前端应用要做的事情，所以`@symph/joy`提供了开箱即用的数据获取服务类`ReactFetchService`, 在`ReactModel`中我们可以直接使用该服务。

```ts
@ReactModel()
export class UserModel extends BaseReactModel<{ user }> {
  async fetchUser() {
    // 使用 fetchService 发送请求，获取数据。
    const resp = await this.fetchService.fetchApi("/user/me");
    const user = await resp.json();
    this.setState(User);
  }
}
```

上例中，我们通过`this.fetchService.fetchApi`请求 API 接口数据，那它为我们提供了哪些能力呢？

- 读取配置，生成完成的请求接口地址。
- 提供请求和响应处理器，错误封装，并发及操时控制等。（待开发）
- 区分服务端渲染和浏览器环境，两者的实现方式有所不同，所以在服务端渲染时`ReactModel`中注入的是 `ReactFetchServerService` 实例，在浏览器上运行时注入的是 `ReactFetchClientService`实例。
  例如：在服务端渲染时有时并不能通过外网域名和端口来加载数据，得使用类似`http://localhost:${config.port}`的地址来获取当前服务启动的端口地址。

### fetchApi

`public fetchApi(path: string, init?: RequestInit): Promise<Response>;`

该方法用于获取 API 数据，添加`apiPrefix`前缀。

我们为了区分请求是为了获取界面还是加载数据，一般会给数据请求的路径上统一添加前缀来区分，默认为`/api`，前缀可在应用配置文件中通过`apiPrefix`定制更改，该方法帮我获取`apiPrefix`配置，拼接完整的 API 请求路径。

例如： 当`apiPrefix: "/blog-api"`时，`fetchApi("/user/me")`等效于：`fetch('/blog-api/user/me')`。

### fetchModuleApi

`public fetchModuleApi(moduleMount: string, path: string, init?: RequestInit): Promise<Response>;`

获取挂载业务模块中提供的接口，`moduleMount`为其挂载点。

> 通常情况下，我们并不直接使用该方法调用第三业务模块中提供的接口，而是依赖第三方模块提供的`ReactModel`或`Service`服务类，调用其方法获取处理后的数据，第三方模块内封装数据请求和数据处理逻辑。

### 可挂载模块获取数据

第三方可挂载业务模块在开发时，并不能预测它挂载到主应用时的名称是什么，所以`@symph/joy`提供了`ReactModuleFetchService`类，其提供`fetchModuleApi`方，在运行时自动获取本模块的挂载值，然后生成完整的请求路径。

例如：当我们开发一个通用的用户管理模块，在其它应用挂载该模块在`users`路径下，那么`reactModuleFetchService.fetchModuleApi("/me")`等效于 `fetch("/api/users/me")`。
