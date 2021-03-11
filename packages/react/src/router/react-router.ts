import { IReactRoute } from "../interfaces";

export class ReactRouter {
  protected routes: IReactRoute[];
  public getRoutes(): IReactRoute[] {
    return this.routes;
  }
  public setRoutes(routes: IReactRoute[]): void {
    this.routes = routes;
  }
}
