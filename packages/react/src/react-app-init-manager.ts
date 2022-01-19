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
  revalidate?: number; // static状态的有效期
}

export interface IInitialModelState {
  /**
   * 获取预渲染的状态
   */
  initialModelStaticState?(): Promise<void | number>;
  // onInitialModelStaticStateDid?(): void;
  /**
   * 获取绑定model中的初始化状态。
   * @param context
   */
  initialModelState?(context: any): Promise<void>;
}

export class ReactAppInitManager<T extends ReactPageInitState = ReactPageInitState> extends BaseReactModel<{ [pathname: string]: T }> {
  public initStage: EnumReactAppInitStage = EnumReactAppInitStage.DEFAULT;

  public initDelay = true;

  // public initTasks: Record<string, Promise<any>[]> = {};

  constructor() {
    super();
  }

  getInitState() {
    return {};
  }

  // /**
  //  *  !!impotent: must call resetInitState, when the initial is finished
  //  * @param pathname
  //  * @param task
  //  */
  // addTask(pathname: string, tasks: Promise<any>[]): void {
  //   let initTasks = this.initTasks[pathname];
  //   if (!initTasks) {
  //     initTasks = [];
  //     this.initTasks[pathname] = initTasks;
  //   }
  //   initTasks.push(...tasks);
  // }

  // async waitAllFinished(pathname: string): Promise<{ revalidate: number | undefined }> {
  //   let tasks = [];
  //   const allPaths = Object.keys(this.initTasks);
  //   for (const path of allPaths) {
  //     if (pathname.startsWith(path)) {
  //       tasks.push(...this.initTasks[path]);
  //     }
  //   }
  //   const results = await Promise.all(tasks);
  //   let minRevalidate = Number.MAX_VALUE;
  //   results.forEach((rst) => {
  //     if (rst && typeof rst === "number" && rst < minRevalidate) {
  //       minRevalidate = rst;
  //     }
  //   });
  //   return {
  //     revalidate: minRevalidate === Number.MAX_VALUE ? undefined : minRevalidate,
  //   };
  // }

  setInitState(
    pathnameArg: string | { pathname: string; index?: boolean },
    { initStatic, init, revalidate }: { initStatic?: ReactRouteInitStatus; init?: ReactRouteInitStatus; revalidate?: number }
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
    if (typeof revalidate !== "undefined") {
      nextState.revalidate = revalidate;
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

  getRouteInitState(pathnameArg: string | { pathname: string; index?: boolean }): T {
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
    // delete this.initTasks[cacheKey];
  }

  private routeControllers = new Map<string, IInitialModelState[]>();

  public registerRouteController(pathname: string, ctl: IInitialModelState) {
    let ctls = this.routeControllers.get(pathname);
    if (!ctls) {
      ctls = [];
      this.routeControllers.set(pathname, ctls);
    }
    ctls.push(ctl);
  }

  public unregisterRouteController(pathname: string, ctl: IInitialModelState) {
    let ctls = this.routeControllers.get(pathname);
    if (!ctls) {
      return;
    }
    const index = ctls.indexOf(ctl);
    if (index < 0) {
      return;
    }
    ctls.splice(index, 1);
  }

  public getRouteControllers(pathname: string): IInitialModelState[] | undefined {
    return this.routeControllers.get(pathname);
  }

  public getAllRouteControllers() {
    return this.routeControllers;
  }

  public async initControllers(pathname: string): Promise<{ revalidate?: number; initStaticCount?: number; initDynamicCount?: number }> {
    const initStage = this.initStage;
    let ctls = this.routeControllers.get(pathname);
    if (!ctls?.length) {
      return { revalidate: undefined, initDynamicCount: 0, initStaticCount: 0 };
    }

    let revalidate: number | undefined = undefined;
    let initStaticTasks: Promise<number | void>[] | undefined;
    let initDynamicTasks: Promise<number | void>[] | undefined;
    let initAllDynamicTask: Promise<any> | undefined;

    const { initStatic, init } = this.getRouteInitState(pathname);
    if (initStage >= EnumReactAppInitStage.STATIC) {
      if (initStatic === undefined || initStatic === ReactRouteInitStatus.NONE || initStatic === ReactRouteInitStatus.ERROR) {
        initStaticTasks = [];
        for (const ctl of ctls) {
          if (ctl.initialModelStaticState) {
            const initStaticTask = ctl.initialModelStaticState();
            initStaticTasks.push(initStaticTask);
          } else {
            // noop
          }
        }
        // this.addTask(pathname, initStaticTasks);
        // try {
        //   const results = await Promise.all(initStaticTasks);
        //   let minRevalidate = Number.MAX_VALUE;
        //   results.forEach((rst) => {
        //     if (rst && typeof rst === "number" && rst < minRevalidate) {
        //       minRevalidate = rst;
        //     }
        //   });
        //   revalidate = minRevalidate === Number.MAX_VALUE ? undefined : minRevalidate;
        //   this.setInitState(pathname, {
        //     initStatic: ReactRouteInitStatus.SUCCESS,
        //     revalidate,
        //   });
        // } catch (e) {
        //   this.setInitState(pathname, {
        //     initStatic: ReactRouteInitStatus.ERROR,
        //   });
        // }
      } else if (initStatic === ReactRouteInitStatus.SUCCESS) {
        // noop
      } else if (initStatic === ReactRouteInitStatus.LOADING) {
        // 数据由外部加载，例如加载预渲染的数据时。noop
      }
    }

    if (initStage >= EnumReactAppInitStage.DYNAMIC) {
      if (init === undefined || init === ReactRouteInitStatus.NONE || init === ReactRouteInitStatus.ERROR) {
        initAllDynamicTask = Promise.all(initStaticTasks || []).then(async () => {
          initDynamicTasks = [];
          for (const ctl of ctls!) {
            if (ctl.initialModelState) {
              const initTask = ctl.initialModelState({});
              initDynamicTasks.push(initTask);
            } else {
              // noop
            }
          }

          try {
            await Promise.all(initDynamicTasks);
            this.setInitState(pathname, {
              init: ReactRouteInitStatus.SUCCESS,
            });
          } catch (e) {
            this.setInitState(pathname, {
              init: ReactRouteInitStatus.ERROR,
            });
          }
        });
        // this.addTask(pathname, [initAllDynamicTask]);
        // for (const ctl of ctls) {
        //   if (ctl.initialModelState) {
        //     const initTask = await ctl.initialModelState({});
        //     initTasks.push(initTask);
        //   } else {
        //     // noop
        //   }
        // }
      }
    }

    if (initStaticTasks) {
      try {
        const results = await Promise.all(initStaticTasks);
        let minRevalidate = Number.MAX_VALUE;
        results.forEach((rst) => {
          if (rst && typeof rst === "number" && rst < minRevalidate) {
            minRevalidate = rst;
          }
        });
        revalidate = minRevalidate === Number.MAX_VALUE ? undefined : minRevalidate;
        this.setInitState(pathname, {
          initStatic: ReactRouteInitStatus.SUCCESS,
          revalidate,
        });
      } catch (e) {
        this.setInitState(pathname, {
          initStatic: ReactRouteInitStatus.ERROR,
        });
      }
    }
    if (initAllDynamicTask) {
      await initAllDynamicTask;
    }

    return {
      revalidate,
      initStaticCount: initStaticTasks?.length,
      initDynamicCount: initDynamicTasks?.length,
    };
  }
}
