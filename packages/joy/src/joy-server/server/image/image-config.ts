import { Default } from "@tsed/schema/lib/decorators";
import { JOY_VALID_LOADERS } from "./constants";

export type LoaderValue = typeof JOY_VALID_LOADERS[number];
type ImageFormat = "image/avif" | "image/webp";

export class ImageConfig {
  @Default([640, 750, 828, 1080, 1200, 1920, 2048, 3840])
  deviceSizes: number[];

  @Default([16, 32, 48, 64, 96, 128, 256, 384])
  imageSizes: number[];

  @Default("/_joy/image")
  path: string;

  @Default([])
  domains: string[];

  @Default(false)
  disableStaticImages: boolean;

  @Default(60)
  minimumCacheTTL: number;

  @Default(["image/webp"])
  formats: ImageFormat[];

  @Default("default")
  loader: LoaderValue;

  @Default(false)
  dangerouslyAllowSVG: boolean;

  @Default(`script-src 'none'; frame-src 'none'; sandbox;`)
  contentSecurityPolicy: string;

  @Default(false)
  unoptimized: boolean;
}

export const imageConfigDefault: ImageConfig = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  path: "/_joy/image",
  loader: "default",
  domains: [],
  disableStaticImages: false,
  minimumCacheTTL: 60,
  formats: ["image/webp"],
  dangerouslyAllowSVG: false,
  contentSecurityPolicy: `script-src 'none'; frame-src 'none'; sandbox;`,
  unoptimized: false,
};
