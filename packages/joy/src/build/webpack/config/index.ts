import webpack from "webpack";
import { base } from "./blocks/base";
import { css } from "./blocks/css";
import { images } from "./blocks/images";
import { ConfigurationContext, pipe } from "./utils";
import { ImageConfig } from "../../../joy-server/server/image/image-config";

export async function build(
  config: webpack.Configuration,
  {
    rootDirectory,
    customAppFile,
    isDevelopment,
    isServer,
    assetPrefix,
    sassOptions,
    lessOptions,
    productionBrowserSourceMaps,
    disableStaticImages,
  }: {
    rootDirectory: string;
    customAppFile: string | null;
    isDevelopment: boolean;
    isServer: boolean;
    assetPrefix: string;
    sassOptions: any;
    lessOptions: any;
    productionBrowserSourceMaps: boolean;
    disableStaticImages: ImageConfig["disableStaticImages"];
  }
): Promise<webpack.Configuration> {
  const ctx: ConfigurationContext = {
    rootDirectory,
    customAppFile,
    isDevelopment,
    isProduction: !isDevelopment,
    isServer,
    isClient: !isServer,
    assetPrefix: assetPrefix ? (assetPrefix.endsWith("/") ? assetPrefix.slice(0, -1) : assetPrefix) : "",
    sassOptions,
    lessOptions,
    productionBrowserSourceMaps,
  };
  const fns = [base(ctx), css(ctx)];
  if (!disableStaticImages) {
    fns.push(images(ctx));
  }
  const fn = pipe(...fns);
  return fn(config) as any;
}
