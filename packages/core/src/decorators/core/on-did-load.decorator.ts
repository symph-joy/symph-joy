const ON_DID_LOAD_META = Symbol("onDidLoad");

/**
 * 装饰provider的onDidLoad事件回调方法。
 * onDidLoad事件触发时机：当容器初始化完所有注册的单例组件是，根据组件扫描结果的顺序，逐个执行回调事件。
 * @constructor
 */
export function OnDidLoad(): PropertyDecorator {
  return (target, key) => {
    const exist = Reflect.getMetadata(ON_DID_LOAD_META, target.constructor);
    if (exist) {
      if (exist === key) {
        // the method has defined as on load call back
        return;
      }
      throw new Error(`Duplicate define @OnDidLoad() on class(name:${target.constructor.name})`);
    }
    const designType = Reflect.getMetadata("design:type", target, key);

    Reflect.defineMetadata(ON_DID_LOAD_META, key, target.constructor);
  };
}

export function getOnDidLoadMethodKey(target: Object): string | symbol {
  return Reflect.getMetadata(ON_DID_LOAD_META, target);
}
