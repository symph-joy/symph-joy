/**
 * 申明一个字段是一个依赖注入的字段
 * @param type 字段的类型，一个Class
 */
function autowire({ type: ModelType }: { type: any }) {
  return function (target: any) {
    const { key } = target;
    const getter = function () {
      // @ts-ignore
      const tempo = this.tempo || (this.props && this.props.tempo);
      if (tempo) {
        return tempo.diObjects[ModelType.namespace];
      } else {
        throw new Error("use autowire out of Controller of Model");
      }
    };
    getter.__ModelType = ModelType;

    target.key = "_" + key;
    return {
      kind: "method",
      key,
      placement: "prototype",
      descriptor: {
        get: getter,
        configurable: true,
        enumerable: true,
      },
    };
  };
}

export default autowire;
export { autowire };
