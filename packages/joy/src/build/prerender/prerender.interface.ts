import { ParsedUrlQuery, BaseReactController } from "@symph/react";

export interface JoyPrerenderInterface {
  getRoute(): string | BaseReactController;

  isFallback(): Promise<boolean> | boolean;

  getPaths(): Promise<Array<string | { params: ParsedUrlQuery }>>;
}

export function isPrerenderClazz(constructor: Function): constructor is { new (): JoyPrerenderInterface } {
  return constructor.prototype.getRoute && constructor.prototype.isFallback && constructor.prototype.getPaths;
}
