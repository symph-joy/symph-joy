import { ReactModel } from "./react-model";
import { EnumReactAppInitStage } from "./react-app-init-stage.enum";

export enum JoyRouteInitState {
  NONE,
  LOADING,
  SUCCESS,
  ERROR,
}

export class ReactAppInitManager extends ReactModel<
  Record<
    string,
    {
      init: JoyRouteInitState;
      initStatic: JoyRouteInitState;
    }
  >
> {
  public initStage: EnumReactAppInitStage = EnumReactAppInitStage.DEFAULT;

  public initTasks: Record<string, Promise<any>[]> = {};

  constructor() {
    super();
  }

  getInitState(): Record<
    string,
    { init: JoyRouteInitState; initStatic: JoyRouteInitState }
  > {
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

  async waitAllFinished(
    pathname: string
  ): Promise<{ revalidate: number | undefined }> {
    let tasks = this.initTasks[pathname] || [];
    const results = await Promise.all(tasks);
    let minRevalidate = Number.MAX_VALUE;
    results.forEach((rst) => {
      if (rst && typeof rst === "number" && rst < minRevalidate) {
        minRevalidate = rst;
      }
    });
    return {
      revalidate:
        minRevalidate === Number.MAX_VALUE ? undefined : minRevalidate,
    };
  }

  setInitState(
    pathname: string,
    {
      initStatic,
      init,
    }: { initStatic?: JoyRouteInitState; init?: JoyRouteInitState }
  ): void {
    const nextState = Object.assign({}, this.state[pathname], {
      initStatic: initStatic,
      init: init,
    });
    this.setState({
      [pathname]: nextState,
    });
  }

  resetInitState(pathname: string): void {
    this.setState({
      [pathname]: {
        initStatic: JoyRouteInitState.NONE,
        init: JoyRouteInitState.NONE,
      },
    });
    delete this.initTasks[pathname];
  }
}
