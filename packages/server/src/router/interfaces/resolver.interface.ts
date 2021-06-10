export interface Resolver {
  resolve(instance: any, basePath: string, providerIds?: string[]): void;
  registerNotFoundHandler(): void;
  registerExceptionHandler(): void;
}
