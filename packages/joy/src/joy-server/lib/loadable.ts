/**
@copyright (c) 2017-present James Kyle <me@thejameskyle.com>
 MIT License
 Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
// https://github.com/jamiebuilds/react-loadable/blob/v5.5.0/src/index.js
// Modified to be compatible with webpack 4 / Joy

import React, { ComponentType, useContext } from "react";
import { Subscription, useSubscription } from "use-subscription";
import { LoadableContext } from "./loadable-context";
import { ReactApplicationReactContext } from "@symph/react";

// type LoadFun = () => Promise<any>;

// interface LoadOptions {
//   loader: LoadFun;
//   loading?: React.ComponentType;
//   delay?: number;
//   timeout?: number;
//   webpack?: () => string[];
//   modules?: string[];
//   suspense?: boolean;
// }

export type LoaderComponent<P = {}> = Promise<React.ComponentType<P> | { default: React.ComponentType<P> }>;

export type Loader<P = {}> = (() => LoaderComponent<P>) | LoaderComponent<P>;

export type LoaderMap = { [mdule: string]: () => Loader<any> };

export type LoadableGeneratedOptions = {
  webpack?(): any;
  modules?(): LoaderMap;
};

export interface LoadableLoadingComponentProps {
  error?: Error | null;
  isLoading?: boolean;
  pastDelay?: boolean;
  retry?: () => void;
  timedOut?: boolean;
}

export type LoadableBaseOptions<P = {}> = LoadableGeneratedOptions & {
  loading?: (({ error, isLoading, pastDelay }: LoadableLoadingComponentProps) => JSX.Element | null) | string;
  loader?: Loader<P> | LoaderMap;
  loadableGenerated?: LoadableGeneratedOptions;
  delay?: number; // delay render loading
  timeout?: number; // loading component timeout
  // ssr?: boolean;
  resolve?: (...args: any) => React.ReactElement;
};

export type LoadableSuspenseOptions = {
  suspense?: boolean;
};

export type LoadableOptions<P = {}> = LoadableBaseOptions<P>;

export type LoadableFn<P = {}> = (opts: LoadableOptions<P> | LoadableSuspenseOptions) => React.ComponentType<P>;

export type LoadableComponent<P = {}> = React.ComponentType<P>;

type ImportedModule = Record<string, unknown> | React.ComponentType | { default: React.ComponentType } | null;

interface LoadState {
  loading: boolean;
  loaded: ImportedModule;
  error: null | Error;
  promise: Promise<ImportedModule>;
  timedOut?: boolean;
  pastDelay?: boolean;
}

const ALL_INITIALIZERS = [] as Array<(...args: any) => Promise<any> | undefined>;
const READY_INITIALIZERS = [] as Array<(...args: any) => Promise<any> | undefined>;
let initialized = false;

function load(loader: Loader): LoadState {
  let promise = typeof loader === "function" ? loader() : loader;

  let state = {
    loading: true,
    loaded: null,
    error: null,
  } as LoadState;

  state.promise = promise
    .then((loaded) => {
      state.loading = false;
      state.loaded = loaded;
      return loaded;
    })
    .catch((err) => {
      state.loading = false;
      state.error = err;
      throw err;
    });

  return state;
}

function defaultResolve(appContext: any, obj: ImportedModule | any, props: any): React.ReactElement {
  const comp = (obj && obj.__esModule ? obj.default : obj) as any;
  return React.createElement(comp, props);
}

function createLoadableComponent<P = {}>(loadFn: typeof load, options: LoadableOptions<P> | LoadableSuspenseOptions) {
  // let opts = Object.assign(
  //   {
  //     loader: null,
  //     loading: null,
  //     delay: 200,
  //     timeout: null,
  //     webpack: null,
  //     modules: null,
  //     suspense: false,
  //   },
  //   options
  // ) as LoadableOptions<P> | LoadableSuspenseOptions;
  const suspenseOpts = ((options as LoadableSuspenseOptions).suspense ? options : { suspense: false }) as LoadableSuspenseOptions;
  const loadableOpts = Object.assign(
    {
      loader: null,
      loading: null,
      delay: 200,
      timeout: null,
      webpack: null,
      modules: null,
      suspense: false,
    },
    options as LoadableOptions
  ) as LoadableOptions<P>;

  let subscription: Subscription<LoadState> & Pick<LoadableSubscription, "retry" | "promise">;
  function init() {
    if (!subscription) {
      const sub = new LoadableSubscription(loadFn, loadableOpts);
      subscription = {
        getCurrentValue: sub.getCurrentValue.bind(sub),
        subscribe: sub.subscribe.bind(sub),
        retry: sub.retry.bind(sub),
        promise: sub.promise.bind(sub),
      };
    }
    return subscription.promise();
  }

  // Server only
  if (typeof window === "undefined" && !suspenseOpts.suspense) {
    ALL_INITIALIZERS.push(init);
  }

  // Client only
  if (!initialized && typeof window !== "undefined" && !suspenseOpts.suspense) {
    // require.resolveWeak check is needed for environments that don't have it available like Jest
    const moduleIds = loadableOpts.webpack && typeof (require as any).resolveWeak === "function" ? loadableOpts.webpack() : loadableOpts.modules;
    if (moduleIds) {
      READY_INITIALIZERS.push((ids: string[]) => {
        for (const moduleId of moduleIds) {
          if (ids.indexOf(moduleId) !== -1) {
            return init();
          }
        }
      });
    }
  }

  function LoadableImpl(props: Record<string, unknown>, ref: React.Ref<any>) {
    init();

    const appContext = useContext(ReactApplicationReactContext);
    const loadableContext = React.useContext(LoadableContext);
    const state = useSubscription(subscription);
    React.useImperativeHandle(
      ref,
      () => ({
        retry: subscription.retry,
      }),
      []
    );

    if (loadableContext && Array.isArray(loadableOpts.modules)) {
      loadableOpts.modules.forEach((moduleName) => {
        loadableContext(moduleName);
      });
    }

    return React.useMemo(() => {
      if (state.loading || state.error) {
        let loadingComp: React.ComponentType<any>;
        const optionLoading = loadableOpts.loading;
        if (typeof optionLoading === "string") {
          const loadingCompDef = appContext?.getProviderDefinition(optionLoading);
          if (loadingCompDef && loadingCompDef.useClass) {
            loadingComp = loadingCompDef.useClass as any;
          } else {
            throw new Error(`Can not find the dynamic loading show component in context. loading componentName = ${loadableOpts.loading}`);
          }
        } else if (typeof optionLoading === "function") {
          loadingComp = optionLoading;
        } else {
          loadingComp = () => null;
        }
        return React.createElement<any>(loadingComp, {
          isLoading: state.loading,
          pastDelay: state.pastDelay,
          timedOut: state.timedOut,
          error: state.error,
          retry: subscription.retry,
        });
      } else if (state.loaded) {
        const resolve = loadableOpts.resolve || defaultResolve;
        return resolve(appContext, state.loaded, props);
      } else {
        return null;
      }
    }, [props, state]);
  }

  let LazyComp: ComponentType;
  if (suspenseOpts.suspense) {
    // @ts-ignore
    LazyComp = React.lazy(loadableOpts.loader!);
  }
  function LazyImpl(props: any, ref: React.Ref<any>) {
    return React.createElement(LazyComp, { ...props, ref });
  }

  const LoadableComponent = suspenseOpts.suspense ? LazyImpl : LoadableImpl;
  (LoadableComponent as any).preload = () => !suspenseOpts.suspense && init();
  (LoadableComponent as any).displayName = "LoadableComponent";

  return React.forwardRef(LoadableComponent);
}

class LoadableSubscription {
  private _loadFn: typeof load;
  private _opts: LoadableOptions;
  private _callbacks: Set<() => any>;
  private _delay: null | any;
  private _timeout: null | any;
  private _res: LoadState;

  private _state: LoadState;

  constructor(private loadFn: typeof load, opts: LoadableOptions<any>) {
    this._loadFn = loadFn;
    this._opts = opts;
    this._callbacks = new Set();
    this._delay = null;
    this._timeout = null;

    this.retry();
  }

  promise() {
    return this._res.promise;
  }

  retry() {
    this._clearTimeouts();
    this._res = this._loadFn(this._opts.loader as Loader);

    this._state = {
      pastDelay: false,
      timedOut: false,
    } as LoadState;

    const { _res: res, _opts: opts } = this;

    if (res.loading) {
      if (typeof opts.delay === "number") {
        if (opts.delay === 0) {
          this._state.pastDelay = true;
        } else {
          this._delay = setTimeout(() => {
            this._update({
              pastDelay: true,
            });
          }, opts.delay);
        }
      }

      if (typeof opts.timeout === "number") {
        this._timeout = setTimeout(() => {
          this._update({ timedOut: true });
        }, opts.timeout);
      }
    }

    this._res.promise
      .then(() => {
        this._update({});
        this._clearTimeouts();
      })
      .catch((_err) => {
        this._update({});
        this._clearTimeouts();
      });
    this._update({});
  }

  _update(partial: Partial<LoadState>) {
    this._state = {
      ...this._state,
      error: this._res.error,
      loaded: this._res.loaded,
      loading: this._res.loading,
      ...partial,
    };
    this._callbacks.forEach((callback) => callback());
  }

  _clearTimeouts() {
    clearTimeout(this._delay);
    clearTimeout(this._timeout);
  }

  getCurrentValue() {
    return this._state;
  }

  subscribe(callback: () => any) {
    this._callbacks.add(callback);
    return () => {
      this._callbacks.delete(callback);
    };
  }
}

function Loadable<P = {}>(opts: LoadableOptions<P> | LoadableSuspenseOptions): React.ComponentType<P> {
  return createLoadableComponent(load, opts) as any;
}

function flushInitializers(initializers: Array<(...args: any) => Promise<any> | undefined>, ids?: (string | number)[]): Promise<any> {
  let promises = [];

  while (initializers.length) {
    let init = initializers.pop();
    if (init) {
      promises.push(init(ids));
    }
  }

  return Promise.all(promises).then(() => {
    if (initializers.length) {
      return flushInitializers(initializers, ids);
    }
  });
}

Loadable.preloadAll = () => {
  return new Promise((resolveInitializers, reject) => {
    flushInitializers(ALL_INITIALIZERS).then(resolveInitializers, reject);
  });
};

Loadable.preloadReady = (ids: (string | number)[] = []) => {
  return new Promise<void>((resolvePreload) => {
    const res = () => {
      initialized = true;
      return resolvePreload();
    };
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(READY_INITIALIZERS, ids).then(res, res);
  });
};

if (typeof window !== "undefined") {
  // @ts-ignore
  window.__JOY_PRELOADREADY = Loadable.preloadReady;
}

export default Loadable;
