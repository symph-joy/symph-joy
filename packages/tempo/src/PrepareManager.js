export default class PrepareManager {
  constructor() {
    // 所在在执行的componentPrepare函数返回的Promise列表
    this.prepares = [];
  }

  prepareComponent(component) {
    if (!component.componentPrepare) {
      // console.debug(`the component has not a componentPrepare method， component${component}`)
      return Promise.resolve();
    }

    const componentPrepare = component.componentPrepare;
    const preparePromise = componentPrepare.call(component);
    // only on server
    if (typeof window === "undefined") {
      this.pushPrepareWaitList(Promise.resolve(preparePromise));
    }

    // do not handle the error
    // preparePromise.catch((e) => {
    //   console.error(e)
    // })

    return preparePromise;
  }

  pushPrepareWaitList(p) {
    this.prepares.push(p);
  }

  waitAllPrepareFinished() {
    return Promise.all(this.prepares);
  }
}
