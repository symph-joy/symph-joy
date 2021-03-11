export interface ProviderLifecycle {
  afterPropertiesSet?(): Promise<void> | void;
  __lifecycle_noop?: undefined; // 防止ts类型检查警告
}
