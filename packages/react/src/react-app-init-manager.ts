import { ReactModel } from "./react-model";

export class ReactAppInitManager extends ReactModel<{
  hasInit: boolean;
  hasInitStatic: boolean;
}> {
  /**
   * 是否是静态渲染，一般用于SSG
   */
  public isRenderStatic = false;

  constructor() {
    super();
  }

  getInitState() {
    return {
      hasInit: false,
      hasInitStatic: false,
    };
  }

  // 在执行中的任务队列
  public initTasks: Promise<any>[] = [];

  addTask(task: Promise<any> | (() => Promise<any>)): void {
    if (task instanceof Promise) {
      this.initTasks.push(task);
    } else {
      const rst = task();
      this.initTasks.push(rst);
    }
  }

  waitAllFinished() {
    return Promise.all(this.initTasks);
  }

  setInitState(hasInitStatic: boolean, hasInit: boolean) {
    this.setState({ hasInitStatic, hasInit });
  }

  resetTask() {
    this.initTasks = [];
    this.setState({
      hasInitStatic: false,
      hasInit: false,
    });
  }
}
