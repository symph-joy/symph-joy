import { NEXT_DATA } from "../next-server/lib/utils";

export class JoyClientConfig {
  public buildId: string;
  public runtimeConfig: Record<string, any>;
  public assetPrefix: string;
  public isFallback?: boolean;
  public nextExport?: boolean;
  public autoExport?: boolean;
  customServer?: boolean;

  static fromJoyData(joyData: NEXT_DATA): JoyClientConfig {
    const instance = new JoyClientConfig();
    const {
      buildId,
      runtimeConfig,
      assetPrefix,
      isFallback,
      nextExport,
      autoExport,
      customServer,
    } = joyData;
    instance.buildId = buildId;
    instance.runtimeConfig = runtimeConfig || {};
    instance.assetPrefix = assetPrefix || "";
    instance.isFallback = isFallback;
    instance.nextExport = nextExport;
    instance.autoExport = autoExport;
    instance.customServer = customServer;
    return instance;
  }
}
