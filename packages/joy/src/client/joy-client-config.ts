import { JOY_DATA } from "../joy-server/lib/utils";

export class JoyClientConfig {
  public buildId: string;
  public runtimeConfig: Record<string, any>;
  public assetPrefix: string;
  public apiPrefix?: string;
  public isFallback?: boolean;
  public joyExport?: boolean;
  public autoExport?: boolean;
  customServer?: boolean;

  static fromJoyData(joyData: JOY_DATA): JoyClientConfig {
    const instance = new JoyClientConfig();
    const { buildId, runtimeConfig, assetPrefix, apiPrefix, isFallback, joyExport, autoExport, customServer } = joyData;
    instance.buildId = buildId;
    instance.runtimeConfig = runtimeConfig || {};
    instance.assetPrefix = assetPrefix || "";
    instance.apiPrefix = apiPrefix || "/api";
    instance.isFallback = isFallback;
    instance.joyExport = joyExport;
    instance.autoExport = autoExport;
    instance.customServer = customServer;
    return instance;
  }
}
