import React from "react";
import _loadable, { LoadableBaseOptions, LoadableFn, LoadableSuspenseOptions, Loader } from "./loadable";

const isServerSide = typeof window === "undefined";

type DynamicLoadableOptions<P> = LoadableBaseOptions<P> & { ssr?: boolean };

export type DynamicOptions<P = {}> = DynamicLoadableOptions<P> | LoadableSuspenseOptions;

export function noSSR<P = {}>(LoadableInitializer: LoadableFn<P>, loadableOptions: LoadableBaseOptions<P>): React.ComponentType<P> {
  // Removing webpack and modules means react-loadable won't try preloading
  delete loadableOptions.webpack;
  delete loadableOptions.modules;

  // This check is necessary to prevent react-loadable from initializing on the server
  if (!isServerSide) {
    return LoadableInitializer(loadableOptions);
  }

  const Loading = loadableOptions.loading!;
  // This will only be rendered on the server side
  return () => <Loading error={null} isLoading pastDelay={false} timedOut={false} />;
}

export function dynamic<P = {}>(dynamicOptions: DynamicOptions<P> | Loader<P>, options?: DynamicOptions<P>): React.ComponentType<P> {
  let loadableFn: LoadableFn<P> = _loadable;
  let loadableOptions: DynamicLoadableOptions<P> = {
    // A loading component is not required, so we default it
    loading: ({ error, isLoading, pastDelay }) => {
      if (!pastDelay) return null;
      if (process.env.NODE_ENV === "development") {
        if (isLoading) {
          return null;
        }
        if (error) {
          return (
            <p>
              {error.message}
              <br />
              {error.stack}
            </p>
          );
        }
      }

      return null;
    },
  };

  // Support for direct import(), eg: dynamic(import('../hello-world'))
  // Note that this is only kept for the edge case where someone is passing in a promise as first argument
  // The react-loadable babel plugin will turn dynamic(import('../hello-world')) into dynamic(() => import('../hello-world'))
  // To make sure we don't execute the import without rendering first
  if (dynamicOptions instanceof Promise) {
    loadableOptions.loader = () => dynamicOptions;
    // Support for having import as a function, eg: dynamic(() => import('../hello-world'))
  } else if (typeof dynamicOptions === "function") {
    loadableOptions.loader = dynamicOptions;
    // Support for having first argument being options, eg: dynamic({loader: import('../hello-world')})
  } else if (typeof dynamicOptions === "object") {
    loadableOptions = { ...loadableOptions, ...dynamicOptions };
  }

  // Support for passing options, eg: dynamic(import('../hello-world'), {loading: () => <p>Loading something</p>})
  loadableOptions = { ...loadableOptions, ...options };

  const suspenseOptions = loadableOptions as LoadableSuspenseOptions & {
    loader: Loader<P>;
  };
  if (!process.env.__JOY_CONCURRENT_FEATURES) {
    // Error if react root is not enabled and `suspense` option is set to true
    if (!process.env.__JOY_REACT_ROOT && suspenseOptions.suspense) {
      // TODO: add error doc when this feature is stable
      throw new Error(`Invalid suspense option usage in @symph/joy/dynamic.`);
    }
  }
  if (suspenseOptions.suspense) {
    return loadableFn(suspenseOptions);
  }

  // coming from build/babel/plugins/react-loadable-plugin.js
  if (loadableOptions.loadableGenerated) {
    loadableOptions = {
      ...loadableOptions,
      ...loadableOptions.loadableGenerated,
    };
    delete loadableOptions.loadableGenerated;
  }

  // support for disabling server side rendering, eg: dynamic(import('../hello-world'), {ssr: false})
  if (typeof loadableOptions.ssr === "boolean") {
    if (!loadableOptions.ssr) {
      delete loadableOptions.ssr;
      return noSSR(loadableFn, loadableOptions);
    }
    delete loadableOptions.ssr;
  }

  return loadableFn(loadableOptions);
}

export default dynamic;
