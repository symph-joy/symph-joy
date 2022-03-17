import { getRouteMeta } from "@symph/react";

const REACT_DYNAMIC_LOAD_META = "__joy_react_dynamic_load";

type ReactDynamicLoadOptions = {
  loading?: string;
  delay?: number; // delay render loading
  timeout?: number; // loading component timeout
};

export type ReactDynamicLoadMeta = ReactDynamicLoadOptions;

export function ReactDynamicLoad(options: ReactDynamicLoadOptions = {}): ClassDecorator {
  return (constructor) => {
    const routeMeta = getRouteMeta(constructor);
    if (!routeMeta) {
      throw new Error(`@RouteDynamicLoad() decorator must used on a ReactRoute class, but ${constructor.name} is not an ReactRoute`);
    }
    if (options.loading && typeof options.loading !== "string") {
      throw new Error(`@ReactDynamicLoad() decorator's "loading" param must be a string`);
    }

    const meta = Object.assign({}, options);

    Reflect.defineMetadata(REACT_DYNAMIC_LOAD_META, meta, constructor);
    return constructor;
  };
}

export function getReactDynamicLoadMeta(target: Object): ReactDynamicLoadMeta | undefined {
  return Reflect.getMetadata(REACT_DYNAMIC_LOAD_META, target) as ReactDynamicLoadMeta;
}
