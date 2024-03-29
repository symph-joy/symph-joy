import {
  Action,
  AnyAction,
  applyMiddleware,
  combineReducers,
  compose,
  createStore as _createStore,
  Middleware,
  Reducer,
  ReducersMapObject,
  Store,
} from "./index";
import { ReactApplicationConfig } from "../react-application-config";
// @ts-ignore
import flatten from "flatten";
import { IModel } from "../interfaces/model.interface";
import { IApplicationContext, RuntimeException } from "@symph/core";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any;
    __REDUX_DEVTOOLS_EXTENSION__OPTIONS: any;
  }
}

const returnSelf = (self: any) => self;

export const ACTION_MERGE_STATE = "__MERGE_STATE";
export const ACTION_INIT_MODEL = "__INIT_MODEL";

export interface ModelStateChangeHandler {
  (changedModels: string[], nextState: Record<string, unknown>, previousState: Record<string, unknown>): boolean | undefined | void;
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
  state: Record<string, unknown>;
}

const noopReduxMiddleware = (store: any) => (next: any) => (action: any) => next();

export class ReactReduxService {
  public app: IApplicationContext;
  public store: Store;
  public models: { [namespace: string]: RegisteredModel } = {};
  public asyncReducers: ReducersMapObject = {};
  public middlewares: Middleware[];
  public preState: Record<string, unknown> = {};

  private stateListenerIdCounter = 1;

  constructor(public appConfig: ReactApplicationConfig, initState: Record<string, any>) {
    // const modelMiddleware = createModelMiddleware(app)

    this.store = this.createStore({
      reducers: this.createReducer(),
      initialState: initState,
      middlewares: [],
    });

    this.preState = this.store.getState();
    this.store.subscribe(this.storeStateListener);
  }

  createStore({ reducers, initialState, middlewares = [] }: any) {
    // extra enhancers
    const reduxMiddlewaresEnhancer = this.appConfig.getReduxMiddlewaresEnhancer() || returnSelf;
    const storeEnhancer = this.appConfig.getStoreEnhancer();
    const extraMiddlewares = this.appConfig.getReduxMiddlewares();

    const enhancedMiddlewares = reduxMiddlewaresEnhancer([...middlewares, ...flatten(extraMiddlewares)]);

    let devtools: any;
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__) {
      devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
    }

    const enhancers = [
      applyMiddleware(...enhancedMiddlewares),
      typeof window !== "undefined" && devtools && devtools(window.__REDUX_DEVTOOLS_EXTENSION__OPTIONS),
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
      noop: (state) => state || {}, // 默认得有一个reducer，否则初始化会失败
    });
    if (reducerEnhancer) {
      combined = reducerEnhancer(combined);
    }
    function mergeStateReducer(state: any = {}, action: AnyAction) {
      if (action.type === ACTION_MERGE_STATE) {
        const nextState = { ...state };
        const nextSubState = action.state;
        for (const key in nextSubState) {
          nextState[key] = { ...nextState[key], ...nextSubState[key] };
        }
        return nextState;
      } else if (action.type === ACTION_INIT_MODEL) {
        const initState = action.state;
        let nextState: any = undefined;
        for (const key in initState) {
          if (state[key] === undefined) {
            if (nextState === undefined) {
              nextState = { ...state };
            }
            nextState[key] = initState[key];
          }
        }
        return nextState || state;
      } else {
        return combined(state, action);
      }
    }
    return mergeStateReducer;
  }

  rmModelStateListener(modelNameSpaces: string[], listener: ModelStateChangeHandler): number {
    let count = 0;
    if (!(modelNameSpaces && modelNameSpaces.length > 0)) {
      return count;
    }
    for (let i = 0; i < modelNameSpaces.length; i++) {
      const registeredModel = this.models[modelNameSpaces[i]];
      if (!registeredModel?.listeners?.length) {
        continue;
      }
      const index = registeredModel.listeners.findIndex((it) => it.listener === listener);
      if (index >= 0) {
        count++;
        registeredModel.listeners.splice(index, 1);
      }
    }
    return count;
  }

  addModelStateListener(modelNameSpaces: string[], listener: ModelStateChangeHandler): number {
    if (!(modelNameSpaces && modelNameSpaces.length > 0)) {
      return 0;
    }
    const listenerWrapper = { id: this.stateListenerIdCounter++, listener };
    for (let i = 0; i < modelNameSpaces.length; i++) {
      const registeredModel = this.models[modelNameSpaces[i]];
      if (typeof registeredModel === "undefined" || registeredModel === null) {
        throw new RuntimeException(`${modelNameSpaces[i]} is not existed`);
      }
      if (typeof registeredModel.listeners === "undefined" || registeredModel.listeners === null) {
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
      if (preState[namespace] !== storeState[namespace] && registeredModel.listeners?.length) {
        for (index = 0; index < registeredModel.listeners.length; index++) {
          const listener = registeredModel.listeners[index];
          let changedModels = effectListeners.get(listener);
          if (!changedModels) {
            changedModels = new Array<string>();
            effectListeners.set(listener, changedModels);
          }
          changedModels.push(namespace);
        }
      }
    }
    if (effectListeners.size > 0) {
      let arr = Array.from(effectListeners);
      arr = arr.sort((a, b) => a[0].id - b[0].id);
      arr.forEach((item) => {
        const handler = item[0].listener;
        const changedModels = item[1];
        handler(changedModels, storeState, preState);
      });
    }
    this.preState = storeState;
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
        throw new RuntimeException(`Register model failed, model namespace ${namespace} is existed`);
      }
    } else {
      registered = {
        modelInstance: model,
      };
      this.models[namespace] = registered;
    }

    // set reducers
    const setStateActionType = namespace + "/__SET_STATE";
    this.asyncReducers[namespace] = (state = initState, action: Action) => {
      if (action.type === setStateActionType) {
        if (this.isStateRecording) {
          this.setStateHistories.push(action as ActionSetState);
        }
        const { state: nextState } = action as ActionSetState;
        return { ...state, ...nextState };
      } else {
        return state;
      }
    };

    this.store.replaceReducer(this.createReducer());

    return model;
  }

  public dispatch(action: any): Promise<unknown> | null | undefined {
    return this.store.dispatch(action);
  }

  public dispatchBatch(actions: AnyAction[]): Promise<unknown> | null | undefined {
    if (!actions?.length) {
      return;
    }
    const batchActions = [];
    let mergeState: Record<string, any> | null = null;
    for (const action of actions) {
      const { type } = action;
      const setStateMatch = typeof type === "string" && type.match(/(\w+)\/__SET_STATE/);
      if (setStateMatch) {
        const modelNs = setStateMatch[1];
        if (!mergeState) {
          mergeState = {};
        }
        mergeState[modelNs] = Object.assign({}, mergeState[modelNs], action.state);
      } else {
        if (mergeState) {
          batchActions.push({
            type: ACTION_MERGE_STATE,
            state: mergeState,
          });
          mergeState = null;
        }
        batchActions.push(action);
      }
    }
    if (mergeState) {
      batchActions.push({
        type: ACTION_MERGE_STATE,
        state: mergeState,
      });
    }
    for (const batchAction of batchActions) {
      this.dispatch(batchAction);
    }
  }

  private setStateHistories: ActionSetState[];
  private isStateRecording = false;

  public startRecordState() {
    this.isStateRecording = true;
    this.setStateHistories = [];
  }

  public stopRecordState(): ActionSetState[] {
    const histories = this.setStateHistories;
    this.setStateHistories = [];
    return histories;
  }
}
