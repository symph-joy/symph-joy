export interface IConfigLoader {
  loadConfig(): Promise<Record<string, any>>;
}
