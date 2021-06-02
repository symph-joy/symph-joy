import React from "react";
import { JoyComponentType, JoyPageContext } from "../joy-server/lib/utils";
import { JoyRouter, useRouter } from "./router";

export type WithRouterProps = {
  router: JoyRouter;
};

export type ExcludeRouterProps<P> = Pick<
  P,
  Exclude<keyof P, keyof WithRouterProps>
>;

export default function withRouter<
  P extends WithRouterProps,
  C = JoyPageContext
>(
  ComposedComponent: JoyComponentType<C, any, P>
): React.ComponentType<ExcludeRouterProps<P>> {
  function WithRouterWrapper(props: any) {
    return <ComposedComponent router={useRouter()} {...props} />;
  }

  WithRouterWrapper.getInitialProps = ComposedComponent.getInitialProps;
  // This is needed to allow checking for custom getInitialProps in _app
  (WithRouterWrapper as any).origGetInitialProps = (ComposedComponent as any).origGetInitialProps;
  if (process.env.NODE_ENV !== "production") {
    const name =
      ComposedComponent.displayName || ComposedComponent.name || "Unknown";
    WithRouterWrapper.displayName = `withRouter(${name})`;
  }

  return WithRouterWrapper;
}
