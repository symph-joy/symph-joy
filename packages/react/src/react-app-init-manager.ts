import { ReactModel } from "./react-model";

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
  /**
   * 是否是静态渲染，一般用于SSG
   */
  public isRenderStatic = false;

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

  waitAllFinished(pathname: string) {
    let tasks = this.initTasks[pathname] || [];
    return Promise.all(tasks);
  }

  setInitState(
    pathname: string,
    {
      initStatic,
      init,
    }: { initStatic?: JoyRouteInitState; init?: JoyRouteInitState }
  ) {
    const nextState = Object.assign({}, this.state[pathname], {
      initStatic: initStatic,
      init: init,
    });
    this.setState({
      [pathname]: nextState,
    });
  }

  resetInitState(pathname: string) {
    this.setState({
      [pathname]: {
        initStatic: JoyRouteInitState.NONE,
        init: JoyRouteInitState.NONE,
      },
    });
    delete this.initTasks[pathname];
  }
}
