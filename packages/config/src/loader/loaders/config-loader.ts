export abstract class ConfigLoader {
  abstract loadConfig(): Promise<Record<string, any>>;
}
