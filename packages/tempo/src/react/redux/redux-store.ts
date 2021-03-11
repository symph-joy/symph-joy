import {
  Action,
  applyMiddleware,
  combineReducers,
  compose,
  createStore as _createStore,
  Middleware,
  Reducer,
  ReducersMapObject,
  Store,
} from "redux";
import { ApplicationConfig } from "../application-config";
import { returnSelf } from "../../utils";
import flatten from "flatten";
import { IModel } from "../interfaces/model.interface";
import { IJoyContext } from "../../interfaces";
import { RuntimeException } from "../../errors/exceptions/runtime.exception";
import { isEmpty, isNil } from "../../utils/shared.utils";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any;
    __REDUX_DEVTOOLS_EXTENSION__OPTIONS: any;
  }
}

export interface ModelStateChangeHandler {
  (
    changedModels: string[],
    nextState: Record<string, unknown>,
    previousState: Record<string, unknown>
  ): boolean | undefined | void;
}

export interface ModelStateListener {
  listener: ModelStateChangeHandler;
  id: number;
}

export interface RegisteredModel {
  listeners?: Array<ModelStateListener>;
  modelInstance: IModel<unknown>;
}

interface ActionSetState extends Action<any> {
  nextState: Record<string, unknown>;
}

const noopReduxMiddleware = (store) => (next) => (action) => next();

export class ReduxStore {
  public app: IJoyContext;
  public store: Store;
  public models: { [namespace: string]: RegisteredModel } = {};
  public asyncReducers: ReducersMapObject = {};
  public middlewares: Middleware[];
  public preState: Record<string, unknown> = {};

  private stateListenerIdCounter = 1;

  constructor(public appConfig: ApplicationConfig) {
    // const modelMiddleware = createModelMiddleware(app)

    this.store = this.createStore({
      reducers: this.createReducer(),
      initialState: appConfig.getInitStoreState() || {},
      middlewares: [],
    });

    this.store.subscribe(this.storeStateListener);
  }

  createStore({ reducers, initialState, middlewares = [] }) {
    // extra enhancers
    const reduxMiddlewaresEnhancer =
      this.appConfig.getReduxMiddlewaresEnhancer() || returnSelf;
    const storeEnhancer = this.appConfig.getStoreEnhancer();
    const extraMiddlewares = this.appConfig.getReduxMiddlewares();

    const enhancedMiddlewares = reduxMiddlewaresEnhancer([
      ...middlewares,
      ...flatten(extraMiddlewares),
    ]);

    let devtools: any;
    if (
      process.env.NODE_ENV !== "production" &&
      window.__REDUX_DEVTOOLS_EXTENSION__
    ) {
      devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
    }

    const enhancers = [
      applyMiddleware(...enhancedMiddlewares),
      devtools && devtools(window.__REDUX_DEVTOOLS_EXTENSION__OPTIONS),
      ...storeEnhancer,
    ].filter(Boolean);
    return _createStore(reducers, initialState, compose(...enhancers));
  }

  createReducer(): Reducer {
    const reducerEnhancer = this.appConfig.getReducerEnhancer() || returnSelf;
    const extraReducers = this.appConfig.getReducers();
    let combined = combineReducers<any>({
      ...this.asyncReducers,
      ...extraReducers,
    });
    if (reducerEnhancer) {
      combined = reducerEnhancer(combined);
    }
    return combined;
  }

  addModelStateListener(
    modelNameSpaces: string[],
    listener: ModelStateChangeHandler
  ): number {
    if (isEmpty(modelNameSpaces)) {
      return;
    }
    const listenerWrapper = { id: this.stateListenerIdCounter++, listener };
    for (let i = 0; i < modelNameSpaces.length; i++) {
      const registeredModel = this.models[modelNameSpaces[i]];
      if (isNil(registeredModel)) {
        throw new RuntimeException(`${modelNameSpaces[i]} is not existed`);
      }
      if (isNil(registeredModel.listeners)) {
        registeredModel.listeners = [];
      }
      registeredModel.listeners.push(listenerWrapper);
    }
    return listenerWrapper.id;
  }

  private storeStateListener = () => {
    const storeState = this.store.getState();
    const preState = this.preState;

    const effectListeners = new Map<ModelStateListener, string[]>();
    let index = 0;
    for (const namespace of Object.getOwnPropertyNames(this.models)) {
      const registeredModel = this.models[namespace];
      if (
        preState[namespace] !== storeState[namespace] &&
        registeredModel.listeners
      ) {
        for (index = 0; index < registeredModel.listeners.length; index++) {
          const listener = registeredModel.listeners[index];
          let changedModels = effectListeners.get(listener);
          if (!changedModels) {
            changedModels = new Array<string>(namespace);
            effectListeners.set(listener, changedModels);
          } else {
            changedModels.push(namespace);
          }
        }
      }
    }
    if (effectListeners.size > 0) {
      new Array(...effectListeners.entries())
        .sort((a, b) => a[0].id - b[0].id)
        .forEach((item) => {
          const handler = item[0].listener;
          const changedModels = item[1];
          handler(changedModels, storeState, preState);
        });
    }
  };

  /**
   * 注册model
   */
  registerModel<T>(model: IModel<T>, initState: unknown): IModel<T> {
    const namespace = model.getNamespace();
    let registered = this.models[namespace];
    if (registered) {
      if (registered.modelInstance === model) {
        // 已经注册了相同model，无需重复注册
        return model;
      } else {
        // namespace 需要保持全局唯一
        throw new RuntimeException(`${namespace} model is not existed`);
      }
    } else {
      registered = {
        modelInstance: model,
      };
      this.models[namespace] = registered;
    }

    // set reducers
    this.asyncReducers[namespace] = (state = initState, action: Action) => {
      if (action.type === namespace + "/__SET_STATE") {
        const { nextState } = action as ActionSetState;
        return { ...state, ...nextState };
      } else {
        return state;
      }
    };

    this.store.replaceReducer(this.createReducer());

    return model;
  }
}
