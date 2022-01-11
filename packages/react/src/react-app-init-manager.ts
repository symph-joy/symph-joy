import { BaseReactModel } from "./base-react-model";
import { EnumReactAppInitStage } from "./react-app-init-stage.enum";

export enum ReactRouteInitStatus {
  NONE,
  LOADING,
  SUCCESS,
  ERROR,
}

export interface ReactPageInitState {
  pathname: string; // 和路由匹配的pathname部分。
  init: ReactRouteInitStatus;
  initStatic: ReactRouteInitStatus;
}

export interface OnInitStaticDidListener {
  onInitialModelStaticStateDid?(): void;
}

export class ReactAppInitManager<T extends ReactPageInitState = ReactPageInitState> extends BaseReactModel<{ [pathname: string]: T }> {
  public initStage: EnumReactAppInitStage = EnumReactAppInitStage.DEFAULT;

  public initTasks: Record<string, Promise<any>[]> = {};

  constructor() {
    super();
  }

  getInitState() {
    return {};
  }

  /**
   *  !!impotent: must call resetInitState, when the initial is finished
   * @param pathname
   * @param task
   */
  addTask(pathname: string, task: Promise<any> | (() => Promise<any>)): void {
    let initTasks = this.initTasks[pathname];
    if (!initTasks) {
      initTasks = [];
      this.initTasks[pathname] = initTasks;
    }
    if (task instanceof Promise) {
      initTasks.push(task);
    } else {
      const rst = task();
      initTasks.push(rst);
    }
  }

  async waitAllFinished(pathname: string): Promise<{ revalidate: number | undefined }> {
    let tasks = [];
    const allPaths = Object.keys(this.initTasks);
    for (const path of allPaths) {
      if (pathname.startsWith(path)) {
        tasks.push(...this.initTasks[path]);
      }
    }
    const results = await Promise.all(tasks);
    let minRevalidate = Number.MAX_VALUE;
    results.forEach((rst) => {
      if (rst && typeof rst === "number" && rst < minRevalidate) {
        minRevalidate = rst;
      }
    });
    return {
      revalidate: minRevalidate === Number.MAX_VALUE ? undefined : minRevalidate,
    };
  }

  setInitState(
    pathnameArg: string | { pathname: string; index: boolean },
    { initStatic, init }: { initStatic?: ReactRouteInitStatus; init?: ReactRouteInitStatus }
  ): void {
    const pathname = typeof pathnameArg === "string" ? pathnameArg : pathnameArg.pathname;
    const index = typeof pathnameArg === "string" ? false : pathnameArg.index;
    const cacheKey = index ? pathname + "/__index" : pathname;
    const nextState = Object.assign(
      {
        pathname,
        index,
        // initStatic: ReactRouteInitStatus.NONE,
        // init: ReactRouteInitStatus.NONE,
      },
      this.state[pathname]
    );
    if (typeof initStatic !== "undefined") {
      nextState.initStatic = initStatic;
    }
    if (typeof init !== "undefined") {
      nextState.init = init;
    }
    this.setState({
      [cacheKey]: nextState,
    });
  }

  getRouteTreeInitState(pathname: string) {
    const state = this.state;
    const paths = Object.keys(state);
    const mathed = [];
    for (const p of paths) {
      if (pathname.startsWith(p)) {
        mathed.push(state[p]);
      }
    }
    return mathed.sort((a, b) => (a.pathname >= b.pathname ? 1 : -1));
  }

  getRouteInitState(pathnameArg: string | { pathname: string; index: boolean }): T {
    const pathname = typeof pathnameArg === "string" ? pathnameArg : pathnameArg.pathname;
    const index = typeof pathnameArg === "string" ? false : pathnameArg.index;
    const cacheKey = index ? pathname + "/__index" : pathname;
    return (
      this.state[cacheKey] ||
      {
        // initStatic: ReactRouteInitStatus.NONE,
        // init: ReactRouteInitStatus.NONE,
      }
    );
  }

  resetInitState(pathnameArg: string | { pathname: string; index: boolean }): void {
    const pathname = typeof pathnameArg === "string" ? pathnameArg : pathnameArg.pathname;
    const index = typeof pathnameArg === "string" ? false : pathnameArg.index;
    const cacheKey = index ? pathname + "/__index" : pathname;

    delete this.state[cacheKey];
    delete this.initTasks[cacheKey];
  }
}
