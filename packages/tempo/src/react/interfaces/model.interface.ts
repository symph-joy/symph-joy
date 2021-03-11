export interface IModel<TModelState> {
  getNamespace(): string;
  getInitState(): TModelState;
}

export type ModelState<M extends IModel<any> | string> = M extends IModel<
  infer P
>
  ? P
  : any;
