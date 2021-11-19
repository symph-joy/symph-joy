import { Reducer, ReducersMapObject } from "redux";
import { ConfigValue } from "@symph/config";

export class ReactApplicationConfig {
  // === redux
  @ConfigValue()
  @ConfigValue()
  private reducers = {};

  @ConfigValue()
  private reducerEnhancer: ((reducer: Reducer) => Reducer) | null | undefined;

  @ConfigValue()
  private reduxMiddlewares: any[] = [];

  @ConfigValue()
  private reduxMiddlewaresEnhancer: (middlerwares: any[]) => any[];

  @ConfigValue()
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
