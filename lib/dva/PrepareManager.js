
export default class PrepareManager {

  // 所在在执行的componentPrepare函数返回的Promise列表
  prepares=[];

  prepareComponent(component){
    if(!component && !component.type || !component.type.prototype.componentPrepare){
      // console.info(`the component has not a componentPrepare method`);
      return;
    }
    const componentPrepare = component.type.prototype.componentPrepare;
    if (componentPrepare) {
      try {
        this.prepares.push(Promise.resolve(componentPrepare.call(component)))
      } catch (e){
        console.error(e);
      }
    }
  }

  waitAllPrepareFinished(){
    return Promise.all(this.prepares)
  }

}
