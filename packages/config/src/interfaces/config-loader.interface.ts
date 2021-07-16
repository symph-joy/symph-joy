export interface IConfigLoader {
  loadConfig(
    path: string,
    curConfig: Record<string, any>
  ): Promise<Record<string, any>>;
}
