/**
 * @publicApi
 */
export enum Scope {
  /**
   * The provider can be shared across multiple classes. The provider lifetime
   * is strictly tied to the application lifecycle. Once the application has
   * bootstrapped, all providers have been instantiated.
   */
  SINGLETON = "singleton",
  /**
   * A new private instance of the provider is instantiated for every use
   */
  PROTOTYPE = "prototype",
  /**
   * A new instance is instantiated for each request processing pipeline
   */
  REQUEST = "request",
}

/**
 * @publicApi
 *
 */
export interface ScopeOptions {
  /**
   * Specifies the lifetime of an injected Provider or Controller.
   */
  scope?: Scope;
}
