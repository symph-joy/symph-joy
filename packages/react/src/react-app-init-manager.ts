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
    let tasks = this.initTasks[pathname] || [];
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

  setInitState(pathname: string, { initStatic, init }: { initStatic?: ReactRouteInitStatus; init?: ReactRouteInitStatus }): void {
    const nextState = Object.assign(
      {
        pathname,
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
      [pathname]: nextState,
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

  getRouteInitState(pathname: string): T {
    return (
      this.state[pathname] ||
      {
        // initStatic: ReactRouteInitStatus.NONE,
        // init: ReactRouteInitStatus.NONE,
      }
    );
  }

  resetInitState(pathname: string): void {
    delete this.state[pathname];
    delete this.initTasks[pathname];
  }
}
