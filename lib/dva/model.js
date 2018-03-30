/**
 * @ModelInstance 将一个Model class封装为单例模式，import 的时候，直接得到该单实例，不用再次实例化
 * @returns {function(*)}
 * @constructor
 */
export default function singleInstanceModel() {

  return Mod => {
    const instance = new Mod();
    instance._type = 'ModelInstance';

    instance._setStore = function (store) {
      instance.store = store;
      instance.dispatch = store.dispatch;

      instance.setState = setState.bind(instance);
      instance.selectState = selectState.bind(instance);
    };

    function setState(nextState) {
      if (!this.dispatch) {
        console.error(`you must requireModel(${instance.namespace}), before use it`)
        return Promise.resolve();
      }
      console.dir( this.dispatch({
        type: this.namespace + '/setState',
        nextState
      }))
    }

    function selectState() {
      if (!this.store) {
        console.error(`you must requireModel(${instance.namespace}), before use it`)
        return;
      }
      return this.store.getState();
    }

    return instance;
  }

}

export const instance = singleInstanceModel;
