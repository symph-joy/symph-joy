import { Reducer, ReducersMapObject } from "redux";
import { Value } from "@symph/config";

export class ReactApplicationConfig {
  // === redux
  @Value()
  private reducers = {};

  @Value()
  private reducerEnhancer: ((reducer: Reducer) => Reducer) | null | undefined;

  @Value()
  private reduxMiddlewares: any[] = [];

  @Value()
  private reduxMiddlewaresEnhancer: (middlerwares: any[]) => any[];

  @Value()
  private storeEnhancer: any[] = [];

  private globalPrefix = "";

  // public getInitStoreState() {
  //   return this.initStoreState;
  // }

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
