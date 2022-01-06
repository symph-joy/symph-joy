# React 组件简介

`@symph/react` 采用 MVC 架构来规范应用各组件的职责，内部状态集中管理和单向数量流动，使 React 专注于界面展示和交互动画，业务逻辑和状态交由 Model 层处理。

## ReactModel

管理业务行为和维护业务数据状态，外界可以通过`state`属性读取当前 Model 的状态，但 **不能** 直接修改状态，改变状态的唯一途径是调用业务方法，在业务方法内调用`setState(nextState)`方法更新状态。

统一状态源，全局状态管理，即为各个 Model 的状态统一在 Redux 的 `store`中管理，同样遵循单向不可变数据流，Model 实例上并未正真保存状态数据，读取状态时，实时从全局状态中获取属于当前 Model 的状态。

## ReactController

协调 ReactModel 和 View，绑定 ReactModel 的状态数据到 View，响应用户的操作，调用 ReactModel 中的业务操作方法，当状态发现变化后，自动刷新 View 界面。

## View

即 React 组件，使用 Model 中的数据来展示界面，且只负责界面样式展示。
