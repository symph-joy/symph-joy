export default class PrepareManager {
  constructor () {
    // 所在在执行的componentPrepare函数返回的Promise列表
    this.prepares = []
  }

  prepareComponent (component) {
    if (!component.componentPrepare) {
      console.debug(`the component has not a componentPrepare method， component${component}`)
      return
    }

    const componentPrepare = component.componentPrepare
    if (componentPrepare) {
      try {
        let prepareResult = componentPrepare.call(component)

        // only server
        if (typeof window === 'undefined') {
          this.pushPrepareWaitList(Promise.resolve(prepareResult))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  pushPrepareWaitList (p) {
    this.prepares.push(p)
  }

  waitAllPrepareFinished () {
    return Promise.all(this.prepares)
  }
}
