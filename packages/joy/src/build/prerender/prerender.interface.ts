import { ParsedUrlQuery, ReactBaseController } from "@symph/react";

export interface JoyPrerenderInterface {
  getRoute(): string | ReactBaseController;

  isFallback(): Promise<boolean> | boolean;

  getPaths(): Promise<Array<string | { params: ParsedUrlQuery }>>;
}

export function isPrerenderClazz(constructor: Function): constructor is { new (): JoyPrerenderInterface } {
  return constructor.prototype.getRoute && constructor.prototype.isFallback && constructor.prototype.getPaths;
}
