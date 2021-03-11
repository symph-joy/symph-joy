/**
 * @ModelInstance 将一个Model class封装为单例模式，import 的时候，直接得到该单实例，不用再次实例化
 * @returns {function(*)}
 * @constructor
 */
function model(config) {
  return function decorator(Model) {
    const autowireFields = Model.elements.filter(
      (el) => el.descriptor.get && el.descriptor.get.__ModelType
    );

    if (typeof window === "undefined") {
      // 暂时只在服务端渲染的时候使用，后续可以考虑在这里加入业务方法调用监控，事务等方法。
      const bizFields = Model.elements.filter(
        (el) =>
          el.kind === "method" &&
          el.placement === "prototype" &&
          el.descriptor.value
      );
      bizFields.forEach((el) => {
        const origin = el.descriptor.value;
        el.descriptor.value = function fieldWrap(...args) {
          const result = origin.apply(this, args);
          if (result && typeof result.then === "function") {
            this._app.prepareManager.pushPrepareWaitList(result);
          }
          return result;
        };
      });
    }

    const namespaceFields = Model.elements.find((el) => el.key === "namespace");
    if (!namespaceFields) {
      throw new Error("the model must has a `namespace` property");
    }
    Model.elements.push({
      ...namespaceFields,
      placement: "static",
    });

    Model.elements.push({
      kind: "field",
      key: "_type",
      placement: "static",
      descriptor: { writable: false, configurable: true, enumerable: false },
      initializer: function () {
        return "__MODEL";
      },
    });

    Model.elements.push({
      kind: "method",
      key: "init",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function (app) {
          this._app = app;
          this.store = app._store;
          this.dispatch = this.store.dispatch;

          this.tempo = app;
          if (autowireFields && autowireFields.length > 0) {
            autowireFields.forEach((autowireField) => {
              const modelClass = autowireField.descriptor.get.__ModelType;
              app.model(modelClass);
            });
          }
        },
      },
    });

    Model.elements.push({
      kind: "method",
      key: "_checkInit",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function () {
          if (!this.store) {
            throw new Error(
              `must use @requireModel(${Model}) decorator on class, before use it`
            );
          }
        },
      },
    });

    Model.elements.push({
      kind: "method",
      key: "setState",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function (nextState) {
          this._checkInit();
          const action = {
            type: this.namespace + "/__SET_STATE",
            nextState,
          };
          return this.dispatch(action);
        },
      },
    });

    Model.elements.push({
      kind: "method",
      key: "getState",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function (nextState) {
          this._checkInit();
          return this.store.getState()[this.namespace];
        },
      },
    });

    Model.elements.push({
      kind: "method",
      key: "getStoreState",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function () {
          this._checkInit();
          return this.store.getState();
        },
      },
    });

    Model.elements.push({
      kind: "method",
      key: "selectState",
      placement: "prototype",
      descriptor: {
        writable: true,
        configurable: true,
        enumerable: false,
        value: function () {
          if (
            process.env.NODE_ENV === "development" &&
            console &&
            console.warn
          ) {
            console.warn(
              "mode selectState is deprecated, use getStoreState() instead"
            );
          }
          return this.getStoreState();
        },
      },
    });

    return Model;
  };
}

export default model;
export { model };
