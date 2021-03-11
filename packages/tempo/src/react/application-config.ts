import { Reducer, ReducersMapObject } from "redux";

export class ApplicationConfig {
  // === redux
  private initStoreState = {};
  private reducers = {};
  private reducerEnhancer: ((reducer: Reducer) => Reducer) | null | undefined;
  private reduxMiddlewares: any[] = [];
  private reduxMiddlewaresEnhancer: (middlerwares: any[]) => any[];
  private storeEnhancer: any[] = [];

  private globalPrefix = "";

  public getInitStoreState() {
    return this.initStoreState;
  }

  public getReducers(): ReducersMapObject {
    return this.reducers;
  }

  public getReducerEnhancer() {
    return this.reducerEnhancer;
  }

  public getReduxMiddlewares() {
    return this.reduxMiddlewares;
  }

  public getReduxMiddlewaresEnhancer() {
    return this.reduxMiddlewaresEnhancer;
  }

  public getStoreEnhancer() {
    return this.storeEnhancer;
  }

  public setGlobalPrefix(prefix: string) {
    this.globalPrefix = prefix;
  }

  public getGlobalPrefix() {
    return this.globalPrefix;
  }
}
