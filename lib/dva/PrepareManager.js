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
        this.prepares.push(Promise.resolve(componentPrepare.call(component)))
      } catch (e) {
        console.error(e)
      }
    }
  }

  waitAllPrepareFinished () {
    return Promise.all(this.prepares)
  }
}
