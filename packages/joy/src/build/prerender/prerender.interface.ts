export type TJoyPrerenderApi = {
  /**
   * not include api prefix
   */
  path: string;
  /**
   * 是否是本模块的api，如果是，则添加本模块的mount值。
   * default = true
   */
  isModuleApi?: boolean;
};

export interface IJoyPrerender {
  isFallback(): Promise<boolean> | boolean;

  getPaths(): Promise<Array<string>>;

  getApis?(): Promise<Array<TJoyPrerenderApi>>;
}

export function isPrerenderClazz(constructor: Function): constructor is { new (): IJoyPrerender } {
  return constructor.prototype.isFallback && constructor.prototype.getPaths;
}
