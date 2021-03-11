export interface Abstract<T = unknown> extends Function {
  prototype: T;
}
