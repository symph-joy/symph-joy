import React, { Context, useContext } from "react";
import { ComponentOptions, Scope } from "@symph/core";
import { ReactComponent } from "./react-component.decorator";
import { useNavigate } from "./router/react-router-dom";
import { ReactRouteContext } from "./router/react-route.decorator";
import { Location } from "history";

export const META_KEY_REACT_CONTROLLER = Symbol("react-controller");
export const META_KEY_REACT_CONTROLLER_CONTEXT_PROPS = Symbol("react-controller-contexts");

export interface ControllerMeta {
  name?: string;
}

export interface PathVariable {
  key: string;
  type: string | number | boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function _ReactController<T>(
  options: ComponentOptions & Partial<ControllerMeta> = {}
): <TFunction extends Function>(target: TFunction) => TFunction | void {
  return (constructor) => {
    class ExtReactControllerDeco extends (constructor as any) {
      public wrapperComponent: typeof constructor;

      constructor(...args: any[]) {
        super(...args);
        this.wrapperComponent = constructor;
        if (!this.hasInitInvoked && typeof this.init === "function") {
          this.init();
        }
      }

      static toString() {
        return constructor.toString();
      }

      static displayName = "RCTL_" + ((constructor as any).displayName || constructor.name);
    }

    // react-controller is instanced by react, so it's scope must be transient
    const clazzName = constructor.name;
    const name = clazzName.replace(clazzName[0], clazzName[0].toLowerCase());
    options = Object.assign(
      // { type: ExtReactControllerDeco, useClass: ExtReactControllerDeco },
      { name },
      options,
      { scope: Scope.PROTOTYPE, lazyRegister: false }
    );
    ReactComponent(options)(ExtReactControllerDeco);
    Reflect.defineMetadata(META_KEY_REACT_CONTROLLER, true, ExtReactControllerDeco);

    return ExtReactControllerDeco as unknown as typeof constructor;
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function ReactController<T>(options: Partial<ControllerMeta> = {}): <TFunction extends Function>(target: TFunction) => any {
  return (constructor) => {
    class ExtReactControllerDeco extends (constructor as any) {
      public wrapperComponent: typeof constructor;

      constructor(...args: any[]) {
        super(...args);
        this.wrapperComponent = constructor;
        if (!this.hasInitInvoked && typeof this.init === "function") {
          this.init();
        }
      }

      shouldComponentUpdate(nextProps: any, nextState: any, nextContext: any): boolean | undefined {
        let superRst = true;
        if (typeof super.shouldComponentUpdate === "function") {
          superRst = super.shouldComponentUpdate(nextProps);
        }
        if (superRst) {
          this._patch_shouldComponentUpdate(nextProps, nextState, nextContext);
          return true;
        }
      }

      componentDidMount(): void {
        this._patch_pre_componentDidMount();
        if (typeof super.componentDidMount === "function") {
          super.componentDidMount();
        }
      }

      componentWillUnmount(): void {
        if (typeof super.componentWillUnmount === "function") {
          super.componentWillUnmount();
        }
        this._patch_componentWillUnmount();
      }

      static toString() {
        return constructor.toString();
      }

      static displayName = "RCTL_" + ((constructor as any).displayName || constructor.name);
    }
    // react-controller is instanced by react, so it's scope must be transient
    const clazzName = constructor.name;
    const name = clazzName.replace(clazzName[0], clazzName[0].toLowerCase());
    options = Object.assign(
      // { type: ExtReactControllerDeco, useClass: ExtReactControllerDeco },
      { name },
      options,
      { scope: Scope.PROTOTYPE, lazyRegister: false }
    );
    ReactComponent(options)(ExtReactControllerDeco);
    Reflect.defineMetadata(META_KEY_REACT_CONTROLLER, true, ExtReactControllerDeco);

    const ReactControllerWrapper = function (props: any) {
      // const appContext = useContext(ReactApplicationReactContext);
      let routeContextValue = useContext(ReactRouteContext);

      const contextProps = Reflect.getMetadata(META_KEY_REACT_CONTROLLER_CONTEXT_PROPS, constructor.prototype);
      const contextValues = {} as any;
      if (contextProps?.length) {
        for (const contextProp of contextProps) {
          const { contextType, propKey } = contextProp;
          const value = useContext(contextType);
          contextValues[propKey] = value;
        }
      }

      const navigate = useNavigate();
      if (!routeContextValue) {
        // 如果是没有放在路由组件内，直接渲染Controller，将会导致路由信息为空。
        const defaultPathname = "/";
        routeContextValue = {
          location: { pathname: defaultPathname } as Location,
          match: { pathname: defaultPathname, pattern: { path: defaultPathname, end: false }, params: {}, pathnameBase: "" },
          navigate: navigate,
          route: { path: defaultPathname, isContainer: true },
          controllers: [],
        };
      }
      return React.createElement(ExtReactControllerDeco as any, {
        key: routeContextValue.match?.pathname,
        ...routeContextValue,
        ...props,
        // __ctx_appContext: appContext,
        __ctx_values: contextValues,
      });
    };

    ReactControllerWrapper.innerController = constructor;

    ReactComponent(options)(ReactControllerWrapper);
    Reflect.defineMetadata(META_KEY_REACT_CONTROLLER, true, ReactControllerWrapper);

    return ReactControllerWrapper;
  };
}

export function getReactControllerMeta(clazz: object): boolean {
  return Reflect.getMetadata(META_KEY_REACT_CONTROLLER, clazz);
}

export function ReactContext(contextType: Context<any>): PropertyDecorator {
  return (target, propKey) => {
    const contexts = Reflect.getMetadata(META_KEY_REACT_CONTROLLER_CONTEXT_PROPS, target) || [];
    contexts.push({ contextType, propKey });
    Reflect.defineMetadata(META_KEY_REACT_CONTROLLER_CONTEXT_PROPS, contexts, target);
  };
}
