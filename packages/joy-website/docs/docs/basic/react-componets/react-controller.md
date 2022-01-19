# ReactController

ReactController 类型的 IoC 组件有点 **特殊**，实例并非 ReactApplicationContext 容器所创建，而是 React 在渲染时，根据界面展示创建实例，然后由容器注入依赖项，界面销毁时，实例也将销毁，其生命周期和 React 类组件一样。
所以在使用 ReactController 时组要注意：

- 申明的依赖项，只能声明在属性上，不能在构造函数里。
- 构造函数内不能使用其申明的属性依赖，因为属性依赖还未注入值，可考虑将初始化方法，移动到 `initialize` 方法内。

## 作用：

`ReactController` 负责关联 ReactModel 和 View，其主要职责有：

- 申明依赖的 ReactModel， 绑定 Model 的状态数据到 View，状态发现变化后，自动刷新 View 界面。
- 响应界面事件，调用 ReactModel 中的业务方法。
- 展示其包含的 View 组件。

这是一个简单的`ReactController`类：

```tsx
import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

@ReactRoute({ path: "/hello" })
@ReactController()
export default class HelloController extends BaseReactController {
  renderView(): ReactNode {
    return <div id="msg">Hello World!</div>;
  }
}
```

## 依赖 ReactModel

使用依赖注入的方式，我们可以将 ReactModel 的实例注入到 ReactController 中，从而使用其方法和状态，注意：注入的方式只能是属性注入。

### 绑定 Model 状态

在渲染方法`renderView`中使用的状态，将自动和当前界面绑定，当状态发生变化后，界面将重新渲染。
可以只一个 ReactModel 中的 **部分** 状态， 而其它 **未使用部分** 状态发现更新，界面不会重新渲染，这能明显减少 React 的重新渲染次数。
在其它地方读取的状态，将不会和界面自动绑定，比如在 React 组件生命周期方法和事件处理方法中。

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

### 避免状态过期

ReactModel 中对应的状态是不可变的，每次更新状态，都会创建一个新的状态，所以每次获取的状态只能代表当前状态，在需要时应当重新获取新的状态。

例如我们尝试给指定用户发送短信，但是发送之前，需要用户确认手机号是否正确，如果有误，可以改正后发送：

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
