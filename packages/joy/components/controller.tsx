import React from "react";
// @ts-ignore
import * as tempoController from "@symph/tempo/controller";
import { Route } from "./router";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";

type mapModelToProps = (modelState: Object, ownProps?: Object) => Object | null;

/**
 * react-router: Dealing with Update Blocking
 */
export function withRouter(
  Component: React.ComponentType<any>
): React.ComponentType<any> {
  class Wrapper extends React.PureComponent<any> {
    static displayName: string;
    static WrappedComponent: React.ComponentType;

    propTypes = {
      wrappedComponentRef: PropTypes.func,
    };

    render() {
      const { wrappedComponentRef, ...remainingProps } = this.props;
      return (
        <Route
          children={(routeComponentProps) => (
            <Component
              {...remainingProps}
              {...routeComponentProps}
              ref={wrappedComponentRef}
            />
          )}
        />
      );
    }
  }

  Wrapper.displayName = `withRouter(${
    Component.displayName || Component.name
  })`;
  Wrapper.WrappedComponent = Component;
  return hoistStatics(Wrapper, Component);
}

const originalController = tempoController.controller;
export const controller = function (
  mapStateToProps: mapModelToProps,
  { hotLoader, enhance }: { hotLoader?: any; enhance?: any } = {}
) {
  function _enhance(enhancers: any[]) {
    if (hotLoader) {
      // 在所有高阶封装之前添加react-hot-loader，否则不会生效
      // hotLoader参数，一般来至于joy-react-hot-loader-label-plugin.js在调试模式下自动添加
      if (typeof hotLoader === "function") {
        enhancers.unshift(hotLoader);
      } else {
        throw new Error(
          "controller: hot loader must be a function or null. not a " +
            typeof hotLoader
        );
      }
    }

    // 添加路由封装，history state发现改变后，通知路由组件重新渲染
    enhancers.push(withRouter);

    if (enhance && typeof enhance === "function") {
      enhancers = enhance(enhancers) || enhancers;
    }
    return enhancers;
  }

  return originalController(mapStateToProps, { enhance: _enhance });
};
tempoController.controller = controller;

export default controller;
