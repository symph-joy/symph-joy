/**
 * @ModelInstance 将一个Model class封装为单例模式，import 的时候，直接得到该单实例，不用再次实例化
 * @returns {function(*)}
 * @constructor
 */
export default function model() {

  return Mod => {

    return class ExMod extends Mod {

      static _type = '__MODEL';

      constructor() {
        super(...arguments);
      }

      init(app) {
        this.store = app._store;
        this.dispatch = this.store.dispatch;
      }

      setState(nextState) {
        this._checkInit();

        const action = {
          type: this.namespace + '/__SET_STATE',
          nextState
        };

        return this.dispatch(action)
      }

      getState(){
        return this.store.getState()[this.namespace];
      }

      selectState() {
        this._checkInit();

        return this.store.getState();
      }

      _checkInit() {
        if (!this.dispatch) {
          throw new Error(`you must requireModel(${Mod}), before use it`)
        }
      }


    }


  }

}

