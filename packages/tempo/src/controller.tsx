import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { isReactClass, shallowEqual } from "./utils";

type mapModelToProps =
  | null
  | ((modelState: Object, ownProps?: Object) => Object);

/**
 * 将react 组件封装为controller组件
 * @param mapStateToProps
 * @param enhance 对Controller进行再次封装，默认有redux connect。 @symph/joy默认提供：with-router, react-hot-loader
 * @returns connect Redux后的HOC
 */
function controller(
  mapStateToProps: mapModelToProps,
  { enhance }: { enhance?: Function | null } = {}
) {
  return (Comp: any) => {
    const modelFields = Comp.elements.filter(
      (el: any) => el.descriptor.get && el.descriptor.get.__ModelType
    );

    Comp.finisher = function (_constructor: any) {
      class ControllerWrapper extends _constructor {
        static contextTypes = {
          tempo: PropTypes.object,
          ..._constructor.contextTypes,
        };

        constructor(...args: any) {
          super(...args);
          const context = args[1];
          const { tempo } = context;

          if (typeof window === "undefined" && this.componentPrepare) {
            // on server
            const { _componentHasPrepared } = this.props;
            if (!_componentHasPrepared) {
              tempo.prepareManager.prepareComponent(this);
            }
          } else {
            // on browser, call componentPrepare on componentDidMount event. why?
            // 1. hmr will recreate the component, constructor will call many times.
            // 2. up loading speed
          }
        }

        componentDidMount() {
          if (super.componentDidMount) {
            super.componentDidMount();
          }
          if (typeof window !== "undefined" && this.componentPrepare) {
            const { _componentHasPrepared } = this.props;
            const { tempo } = this.context;
            if (!_componentHasPrepared) {
              tempo.prepareManager.prepareComponent(this);
            }
          }
        }

        // 服务端渲染时，不可调用setState方法，设置不会生效，会导致服务端和浏览器上渲染的结果不一致
        setState(...args: any) {
          if (
            typeof window === "undefined" &&
            process.env.NODE_ENV !== "production"
          ) {
            const displayName =
              _constructor.displayName || _constructor.name || "Component";
            throw new Error(
              `Controller(${displayName}): can't call setState during componentPrepare, this will not work on ssr`
            );
          }
          super.setState(...args);
        }
      }

      // default enhancer
      let enhancers = [];
      enhancers.push(
        connect(mapStateToProps, (dispatch) => ({ dispatch }), null, {
          pure: false,
        })
      );
      // custom enhancers
      if (enhance && typeof enhance === "function") {
        enhancers = enhance(enhancers) || enhancers;
      }

      let EnhancedComp: any = ControllerWrapper;

      if (enhancers && enhancers.length > 0) {
        let hasConnectHOC = false;
        enhancers.forEach((enhancer: any) => {
          EnhancedComp = enhancer(EnhancedComp);
          if (typeof EnhancedComp === "undefined" || EnhancedComp === null) {
            throw new Error(
              "the enhance must return a React.Component or React.PureComponent"
            );
          }
          if (
            EnhancedComp.displayName &&
            /Connect\(/.test(EnhancedComp.displayName)
          ) {
            hasConnectHOC = true;
          }
        });
        // check
        if (process.env.NODE_ENV === "development") {
          if (!hasConnectHOC && console.warn) {
            console.warn(
              `controller(${
                getCompDisplayName(_constructor) || ""
              }) redux connect hoc has been removed,`
            );
          }
        }
      } else {
        if (process.env.NODE_ENV === "development" && console.warn) {
          console.warn(
            `controller(${
              getCompDisplayName(_constructor) || ""
            }) enhancers is empty, you should not remove all enhancers`
          );
        }
      }

      return injectModelsToProps(EnhancedComp, modelFields);
    };
  };
}

function injectModelsToProps(
  Comp: React.ComponentType,
  modelFieldDescriptors: any
) {
  // get joy state from store
  const joyWrapMapStateToProps = (store: any, ownProps: any) => {
    return {
      _joyStoreState: store,
    };
  };

  class ModelWrapper extends React.Component<any> {
    static contextTypes = {
      tempo: PropTypes.object,
    };

    constructor(props: any, context: any) {
      super(props, context);
      const { _joyStoreState } = props;
      const { tempo } = context;

      // register bind models
      if (modelFieldDescriptors && modelFieldDescriptors.length > 0) {
        modelFieldDescriptors.forEach((modelField: any) => {
          const modelClass = modelField.descriptor.get.__ModelType;
          tempo.model(modelClass);
        });
        const newStoreState = tempo.getState();
        // WARNING react-rudex默认并不会立即更新mapStateToProps中的storeState入参，
        // 导致在子组件树中使用刚注册的model的state会出错，所以在这里主动将新状态更新到当前渲染的状态上。
        Object.assign(_joyStoreState, newStoreState);
      }
    }

    shouldComponentUpdate(nextProps: any, nextState: any, nextContext: any) {
      if (!shallowEqual(this.props._joyStoreState, nextProps._joyStoreState)) {
        return !shallowEqual(this.props, nextProps, {
          exclude: ["_joyStoreState"],
        });
      }
      return true;
    }

    render() {
      const { _joyStoreState, ...retainProps } = this.props;
      const isPrepared = _joyStoreState["@@joy"].isPrepared;

      const childProps = {
        ...retainProps,
        _componentHasPrepared: isPrepared,
        _joyStoreState: undefined,
      };
      // @ts-ignore
      return <Comp {...childProps} tempo={this.context.tempo} />;
    }
  }

  const Connected = connect(joyWrapMapStateToProps, null, null, {
    pure: false,
  })(ModelWrapper);
  // 这里必须返回一个class，不能改变装饰的返回类型，否则无法使用多个装饰器同时装饰一个类。
  if (isReactClass(Connected)) {
    return Connected;
  } else {
    return class extends React.PureComponent {
      render() {
        return <Connected {...this.props} />;
      }
    };
  }
}

/***
 * 注册依赖的Model
 * 建议在controller中使用autowire申明依赖的model
 * @param models array
 * @returns {function(*)}
 */
function requireModel(...models: Array<any>) {
  return (Comp: any) => {
    if (!models || models.length === 0) {
      return;
    }

    Comp.finisher = function (_constructor: React.ComponentClass<any>) {
      class Wrapper extends _constructor {
        static contextTypes = {
          tempo: PropTypes.object,
          ..._constructor.contextTypes,
        };

        constructor(props: any, context: any) {
          super(props, context);
          const { storeState } = props;
          const { tempo } = context;

          models.forEach((model) => {
            tempo.model(model);
          });
          const newStoreState = tempo.getState();
          // WARNING react-rudex默认并不会立即更新mapStateToProps中的storeState入参，
          // 导致在子组件树中使用刚注册的model的state会出错，所以在这里主动将新状态更新到当前渲染的状态上。
          Object.assign(storeState, newStoreState);
        }
      }

      const EnhancedComp = connect(
        (storeState, ownProps) => {
          return { storeState };
        },
        (dispatch) => ({ dispatch }),
        null,
        { pure: false }
      )(Wrapper);

      if (isReactClass(EnhancedComp)) {
        return EnhancedComp;
      } else {
        return class extends React.PureComponent {
          render() {
            return <EnhancedComp {...this.props} />;
          }
        };
      }
    };
  };
}

function getCompDisplayName(Comp: React.ComponentType) {
  return Comp.displayName || Comp.name;
}

export default controller;
export { controller, requireModel, connect };
