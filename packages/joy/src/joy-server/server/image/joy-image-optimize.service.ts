import { Component } from "@symph/core";
import { JoyReactServer } from "../joy-react-server";
import { IncomingMessage, ServerResponse } from "http";
import { JoyAppConfig } from "../joy-app-config";
import { join } from "path";
import { promises } from "fs";
import { getContentType, getExtension } from "../serve-static";
import Stream from "stream";
import { sendEtagResponse } from "../send-payload";
import { mediaType } from "@hapi/accept";
import { createHash } from "crypto";
import nodeUrl, { UrlWithParsedQuery } from "url";
// @ts-ignore no types for is-animated
import isAnimated from "is-animated";
import chalk from "chalk";
import { getOrientation, Orientation } from "get-orientation";
import imageSizeOf from "image-size";
import { NotFoundException } from "@symph/server";
import contentDisposition from "content-disposition";

type XCacheHeader = "MISS" | "HIT" | "STALE";

let sharp: ((input?: string | Buffer, options?: import("sharp").SharpOptions) => import("sharp").Sharp) | undefined;

let showSharpMissingWarning = process.env.NODE_ENV === "production";

const AVIF = "image/avif";
const WEBP = "image/webp";
const PNG = "image/png";
const JPEG = "image/jpeg";
const GIF = "image/gif";
const SVG = "image/svg+xml";
const CACHE_VERSION = 3;
const ANIMATABLE_TYPES = [WEBP, PNG, GIF];
const VECTOR_TYPES = [SVG];
const BLUR_IMG_SIZE = 8; // should match `joy-image-loader`
const inflightRequests = new Map<string, Promise<undefined>>();

export class ImageError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);

    // ensure an error status is used > 400
    if (statusCode >= 400) {
      this.statusCode = statusCode;
    } else {
      this.statusCode = 500;
    }
  }
}

export interface CachedImageValue {
  kind: "IMAGE";
  etag: string;
  buffer: Buffer;
  extension: string;
  isMiss?: boolean;
  isStale?: boolean;
}

type IncrementalCacheEntry = {
  curRevalidate?: number | false;
  // milliseconds to revalidate after
  revalidateAfter: number | false;
  isStale?: boolean;
  value: CachedImageValue | null;
};

export interface ImageParamsResult {
  href: string;
  isAbsolute: boolean;
  isStatic: boolean;
  width: number;
  quality: number;
  mimeType: string;
  sizes: number[];
  minimumCacheTTL: number;
}

export class ImageOptimizerCache {
  private cacheDir: string;
  private joyAppConfig: JoyAppConfig;

  static getCacheKey({ href, width, quality, mimeType }: { href: string; width: number; quality: number; mimeType: string }): string {
    return getHash([CACHE_VERSION, href, width, quality, mimeType]);
  }

  constructor(joyAppConfig: JoyAppConfig) {
    this.cacheDir = joyAppConfig.resolveAppDir(joyAppConfig.distDir, "cache", "images");
    this.joyAppConfig = joyAppConfig;
  }

  async get(cacheKey: string): Promise<IncrementalCacheEntry | null> {
    if (this.joyAppConfig.dev) {
      return null;
    }
    try {
      const cacheDir = join(this.cacheDir, cacheKey);
      const files = await promises.readdir(cacheDir);
      const now = Date.now();

      for (const file of files) {
        const [maxAgeSt, expireAtSt, etag, extension] = file.split(".");
        const buffer = await promises.readFile(join(cacheDir, file));
        const expireAt = Number(expireAtSt);
        const maxAge = Number(maxAgeSt);

        return {
          value: {
            kind: "IMAGE",
            etag,
            buffer,
            extension,
          },
          revalidateAfter: Math.max(maxAge, this.joyAppConfig.images.minimumCacheTTL) * 1000 + Date.now(),
          curRevalidate: maxAge,
          isStale: now > expireAt,
        };
      }
    } catch (_) {
      // failed to read from cache dir, treat as cache miss
    }
    return null;
  }
  async set(cacheKey: string, value: CachedImageValue | null, revalidate?: number | false) {
    if (value?.kind !== "IMAGE") {
      throw new Error("invariant attempted to set non-image to image-cache");
    }

    if (typeof revalidate !== "number") {
      throw new Error("invariant revalidate must be a number for image-cache");
    }
    const expireAt = Math.max(revalidate, this.joyAppConfig.images.minimumCacheTTL) * 1000 + Date.now();

    try {
      await this.writeToCacheDir(join(this.cacheDir, cacheKey), value.extension, revalidate, expireAt, value.buffer, value.etag);
    } catch (err) {
      console.error(`Failed to write image to cache ${cacheKey}`, err);
    }
  }

  async writeToCacheDir(dir: string, extension: string, maxAge: number, expireAt: number, buffer: Buffer, etag: string) {
    const filename = join(dir, `${maxAge}.${expireAt}.${etag}.${extension}`);

    // Added in: v14.14.0 https://nodejs.org/api/fs.html#fspromisesrmpath-options
    // attempt cleaning up existing stale cache
    if ((promises as any).rm) {
      await (promises as any).rm(dir, { force: true, recursive: true }).catch(() => {});
    } else {
      await promises.rmdir(dir, { recursive: true }).catch(() => {});
    }
    await promises.mkdir(dir, { recursive: true });
    await promises.writeFile(filename, buffer);
  }
}

@Component()
export class JoyImageOptimizeService {
  private hasInit = false;

  private squooshImagePool: any;
  private imageOptimizerCache: ImageOptimizerCache;

  constructor(private joyAppConfig: JoyAppConfig) {
    this.imageOptimizerCache = new ImageOptimizerCache(joyAppConfig);
  }

  private initOptimizer() {
    this.hasInit = true;
    try {
      sharp = require(process.env.JOY_SHARP_PATH || "sharp");
    } catch (e) {
      // Sharp not present on the server, Squoosh fallback will be used
    }
    if (!sharp) {
      const { ImagePool } = require("@squoosh/lib");
      this.squooshImagePool = new ImagePool(1);
    }
  }

  validateParams(req: IncomingMessage, query: UrlWithParsedQuery["query"]): ImageParamsResult | { errorMessage: string } {
    const imageData = this.joyAppConfig.images;
    const isDev = this.joyAppConfig.dev;
    const { deviceSizes = [], imageSizes = [], domains = [], minimumCacheTTL = 60, formats = ["image/webp"] } = imageData;
    const { url, w, q } = query;
    let href: string;

    if (!url) {
      return { errorMessage: '"url" parameter is required' };
    } else if (Array.isArray(url)) {
      return { errorMessage: '"url" parameter cannot be an array' };
    }

    let isAbsolute: boolean;

    if (url.startsWith("/")) {
      href = url;
      isAbsolute = false;
    } else {
      let hrefParsed: URL;

      try {
        hrefParsed = new URL(url);
        href = hrefParsed.toString();
        isAbsolute = true;
      } catch (_error) {
        return { errorMessage: '"url" parameter is invalid' };
      }

      if (!["http:", "https:"].includes(hrefParsed.protocol)) {
        return { errorMessage: '"url" parameter is invalid' };
      }

      if (!domains || !domains.includes(hrefParsed.hostname)) {
        return { errorMessage: '"url" parameter is not allowed' };
      }
    }

    if (!w) {
      return { errorMessage: '"w" parameter (width) is required' };
    } else if (Array.isArray(w)) {
      return { errorMessage: '"w" parameter (width) cannot be an array' };
    }

    if (!q) {
      return { errorMessage: '"q" parameter (quality) is required' };
    } else if (Array.isArray(q)) {
      return { errorMessage: '"q" parameter (quality) cannot be an array' };
    }

    const width = parseInt(w, 10);

    if (!width || isNaN(width)) {
      return {
        errorMessage: '"w" parameter (width) must be a number greater than 0',
      };
    }

    const sizes = [...(deviceSizes || []), ...(imageSizes || [])];

    if (isDev) {
      sizes.push(BLUR_IMG_SIZE);
    }

    if (!sizes.includes(width)) {
      return {
        errorMessage: `"w" parameter (width) of ${width} is not allowed`,
      };
    }

    const quality = parseInt(q);

    if (isNaN(quality) || quality < 1 || quality > 100) {
      return {
        errorMessage: '"q" parameter (quality) must be a number between 1 and 100',
      };
    }

    const mimeType = getSupportedMimeType(formats || [], req.headers["accept"]);

    const isStatic = url.startsWith(`${this.joyAppConfig.basePath || ""}/_joy/static/media`);

    return {
      href,
      sizes,
      isAbsolute,
      isStatic,
      width,
      quality,
      mimeType,
      minimumCacheTTL,
    };
  }

  async handleRequest(server: JoyReactServer, req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery) {
    const imagesConfig = this.joyAppConfig.images;

    if (imagesConfig.loader !== "default") {
      throw new NotFoundException("image loader is not default");
    }
    const paramsResult = this.validateParams(req, parsedUrl.query);

    if ("errorMessage" in paramsResult) {
      res.statusCode = 400;
      res.end(paramsResult.errorMessage);
      return { finished: true };
    }

    const cacheKey = ImageOptimizerCache.getCacheKey(paramsResult);

    try {
      const cacheEntry = await this.imageOptimizerCache.get(cacheKey);
      if (cacheEntry && cacheEntry.value) {
        this.sendResponse(
          req,
          res,
          paramsResult.href,
          cacheEntry.value.extension,
          cacheEntry.value.buffer,
          paramsResult.isStatic,
          cacheEntry.value.isMiss ? "MISS" : cacheEntry.value.isStale ? "STALE" : "HIT",
          imagesConfig.contentSecurityPolicy
        );
        return { finished: true };
      }

      const { buffer, contentType, maxAge } = await this.imageOptimizer(server, req, res, paramsResult);
      const etag = getHash([buffer]);
      const imageValue = {
        kind: "IMAGE" as const,
        buffer,
        etag,
        extension: getExtension(contentType) as string,
      } as CachedImageValue;
      await this.imageOptimizerCache.set(cacheKey, imageValue, maxAge);

      this.sendResponse(
        req,
        res,
        paramsResult.href,
        imageValue.extension,
        imageValue.buffer,
        paramsResult.isStatic,
        imageValue.isMiss ? "MISS" : imageValue.isStale ? "STALE" : "HIT",
        imagesConfig.contentSecurityPolicy
      );
    } catch (err) {
      if (err instanceof ImageError) {
        res.statusCode = err.statusCode;
        res.end(err.message);
        return {
          finished: true,
        };
      }
      throw err;
    }
    return { finished: true };
  }

  async imageOptimizer(
    server: JoyReactServer,
    _req: IncomingMessage,
    _res: ServerResponse,
    paramsResult: ImageParamsResult
  ): Promise<{ buffer: Buffer; contentType: string; maxAge: number }> {
    if (!this.hasInit) {
      this.initOptimizer();
    }
    let upstreamBuffer: Buffer;
    let upstreamType: string | null;
    let maxAge: number;
    const { isAbsolute, href, width, mimeType, quality } = paramsResult;

    if (isAbsolute) {
      const upstreamRes = await fetch(href);

      if (!upstreamRes.ok) {
        console.error("upstream image response failed for", href, upstreamRes.status);
        throw new ImageError(upstreamRes.status, '"url" parameter is valid but upstream response is invalid');
      }

      upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
      upstreamType = this.detectContentType(upstreamBuffer) || upstreamRes.headers.get("Content-Type");
      maxAge = this.getMaxAge(upstreamRes.headers.get("Cache-Control"));
    } else {
      try {
        const resBuffers: Buffer[] = [];
        const mockRes: any = new Stream.Writable();

        const isStreamFinished = new Promise(function (resolve, reject) {
          mockRes.on("finish", () => resolve(true));
          mockRes.on("end", () => resolve(true));
          mockRes.on("error", (err: any) => reject(err));
        });

        mockRes.write = (chunk: Buffer | string) => {
          resBuffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        };
        mockRes._write = (chunk: Buffer | string, _encoding: string, callback: () => void) => {
          mockRes.write(chunk);
          // According to Node.js documentation, the callback MUST be invoked to signal that
          // the write completed successfully. If this callback is not invoked, the 'finish' event
          // will not be emitted.
          // https://nodejs.org/docs/latest-v16.x/api/stream.html#writable_writechunk-encoding-callback
          callback();
        };

        const mockHeaders: Record<string, string | string[]> = {};

        mockRes.writeHead = (_status: any, _headers: any) => Object.assign(mockHeaders, _headers);
        mockRes.getHeader = (name: string) => mockHeaders[name.toLowerCase()];
        mockRes.getHeaders = () => mockHeaders;
        mockRes.getHeaderNames = () => Object.keys(mockHeaders);
        mockRes.setHeader = (name: string, value: string | string[]) => (mockHeaders[name.toLowerCase()] = value);
        mockRes.removeHeader = (name: string) => {
          delete mockHeaders[name.toLowerCase()];
        };
        mockRes._implicitHeader = () => {};
        mockRes.connection = _res.connection;
        mockRes.finished = false;
        mockRes.statusCode = 200;

        const mockReq: any = new Stream.Readable();

        mockReq._read = () => {
          mockReq.emit("end");
          mockReq.emit("close");
          return Buffer.from("");
        };

        mockReq.headers = _req.headers;
        mockReq.method = _req.method;
        mockReq.url = href;
        mockReq.connection = _req.connection;

        // await handleRequest(mockReq, mockRes, nodeUrl.parse(href, true));
        await server.getRequestHandler()(mockReq, mockRes, nodeUrl.parse(href, true));
        await isStreamFinished;

        if (!mockRes.statusCode) {
          console.error("image response failed for", href, mockRes.statusCode);
          throw new ImageError(mockRes.statusCode, '"url" parameter is valid but internal response is invalid');
        }
        _res.statusCode = mockRes.statusCode;

        upstreamBuffer = Buffer.concat(resBuffers);
        upstreamType = this.detectContentType(upstreamBuffer) || mockRes.getHeader("Content-Type");
        maxAge = this.getMaxAge(mockRes.getHeader("Cache-Control"));
      } catch (err) {
        console.error("upstream image response failed for", href, err);
        throw new ImageError(500, '"url" parameter is valid but upstream response is invalid');
      }
    }

    if (upstreamType === SVG && !this.joyAppConfig.images.dangerouslyAllowSVG) {
      console.error(`The requested resource "${href}" has type "${upstreamType}" but dangerouslyAllowSVG is disabled`);
      throw new ImageError(400, '"url" parameter is valid but image type is not allowed');
    }

    if (upstreamType) {
      const vector = VECTOR_TYPES.includes(upstreamType);
      const animate = ANIMATABLE_TYPES.includes(upstreamType) && isAnimated(upstreamBuffer);

      if (vector || animate) {
        return { buffer: upstreamBuffer, contentType: upstreamType, maxAge };
      }
      if (!upstreamType.startsWith("image/")) {
        console.error("The requested resource isn't a valid image for", href, "received", upstreamType);
        throw new ImageError(400, "The requested resource isn't a valid image.");
      }
    }

    let contentType: string;

    if (mimeType) {
      contentType = mimeType;
    } else if (upstreamType?.startsWith("image/") && getExtension(upstreamType)) {
      contentType = upstreamType;
    } else {
      contentType = JPEG;
    }
    try {
      let optimizedBuffer: Buffer | undefined;
      if (sharp) {
        // Begin sharp transformation logic
        const transformer = sharp(upstreamBuffer);

        transformer.rotate();

        const { width: metaWidth } = await transformer.metadata();

        if (metaWidth && metaWidth > width) {
          transformer.resize(width);
        }

        if (contentType === AVIF) {
          if (transformer.avif) {
            const avifQuality = quality - 15;
            transformer.avif({
              quality: Math.max(avifQuality, 0),
              chromaSubsampling: "4:2:0", // same as webp
            });
          } else {
            console.warn(
              chalk.yellow.bold("Warning: ") +
                `Your installed version of the 'sharp' package does not support AVIF images. Run 'yarn add sharp@latest' to upgrade to the latest version.\n`
            );
            transformer.webp({ quality });
          }
        } else if (contentType === WEBP) {
          transformer.webp({ quality });
        } else if (contentType === PNG) {
          transformer.png({ quality });
        } else if (contentType === JPEG) {
          transformer.jpeg({ quality });
        }

        optimizedBuffer = await transformer.toBuffer();
        // End sharp transformation logic
      } else {
        const image = this.squooshImagePool.ingestImage(upstreamBuffer);
        // Show sharp warning in production once
        if (showSharpMissingWarning) {
          console.warn(
            chalk.yellow.bold("Warning: ") +
              `For production Image Optimization with @symph/joy, the optional 'sharp' package is strongly recommended. Run 'yarn add sharp', and @symph/joy will use it automatically for Image Optimization.`
          );
          showSharpMissingWarning = false;
        }

        // Begin Squoosh transformation logic
        const orientation = await getOrientation(upstreamBuffer);

        // const operations: Operation[] = [];
        const preprocessOptions = {} as any;
        if (orientation === Orientation.RIGHT_TOP) {
          // operations.push({ type: "rotate", numRotations: 1 });
          preprocessOptions["rotate"] = {
            numRotations: 1,
          };
        } else if (orientation === Orientation.BOTTOM_RIGHT) {
          // operations.push({ type: "rotate", numRotations: 2 });
          preprocessOptions["rotate"] = {
            numRotations: 2,
          };
        } else if (orientation === Orientation.LEFT_BOTTOM) {
          // operations.push({ type: "rotate", numRotations: 3 });
          preprocessOptions["rotate"] = {
            numRotations: 3,
          };
        } else {
          // TODO: support more orientations
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // const _: never = orientation
        }

        // operations.push({ type: "resize", width });
        preprocessOptions["resize"] = {
          width,
        };
        await image.preprocess(preprocessOptions);

        if (contentType === AVIF) {
          // optimizedBuffer = await processBuffer(upstreamBuffer, operations, "avif", quality);
          await image.encode({ avif: { quality } });
          optimizedBuffer = (await image.encodedWith.avif).binary;
        } else if (contentType === WEBP) {
          // optimizedBuffer = await processBuffer(upstreamBuffer, operations, "webp", quality);
          await image.encode({ webp: { quality } });
          optimizedBuffer = (await image.encodedWith.webp).binary;
        } else if (contentType === PNG) {
          // optimizedBuffer = await processBuffer(upstreamBuffer, operations, "png", quality);
          await image.encode({ oxipng: { quality } });
          optimizedBuffer = (await image.encodedWith.oxipng).binary;
        } else if (contentType === JPEG) {
          // optimizedBuffer = await processBuffer(upstreamBuffer, operations, "jpeg", quality);
          await image.encode({ mozjpeg: { quality } });
          optimizedBuffer = (await image.encodedWith.mozjpeg).binary;
        }

        // End Squoosh transformation logic
      }
      if (optimizedBuffer) {
        return {
          buffer: optimizedBuffer,
          contentType,
          maxAge: Math.max(maxAge, this.joyAppConfig.images.minimumCacheTTL),
        };
      } else {
        throw new ImageError(500, "Unable to optimize buffer");
      }
    } catch (error) {
      console.log(error);
      return {
        buffer: upstreamBuffer,
        contentType: upstreamType!,
        maxAge,
      };
    }
  }

  getFileNameWithExtension(url: string, contentType: string | null): string | void {
    const [urlWithoutQueryParams] = url.split("?");
    const fileNameWithExtension = urlWithoutQueryParams.split("/").pop();
    if (!contentType || !fileNameWithExtension) {
      return;
    }

    const [fileName] = fileNameWithExtension.split(".");
    const extension = getExtension(contentType);
    return `${fileName}.${extension}`;
  }

  setResponseHeaders(
    req: IncomingMessage,
    res: ServerResponse,
    url: string,
    etag: string,
    contentType: string | null,
    isStatic: boolean,
    xCache: XCacheHeader,
    contentSecurityPolicy: string
  ) {
    res.setHeader("Vary", "Accept");
    res.setHeader("Cache-Control", isStatic ? "public, max-age=315360000, immutable" : `public, max-age=0, must-revalidate`);
    if (sendEtagResponse(req, res, etag)) {
      // already called res.end() so we're finished
      return { finished: true };
    }
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const fileName = this.getFileNameWithExtension(url, contentType);
    if (fileName) {
      res.setHeader("Content-Disposition", contentDisposition(fileName, { type: "inline" }));
    }

    if (contentSecurityPolicy) {
      res.setHeader("Content-Security-Policy", contentSecurityPolicy);
    }
    res.setHeader("X-Joyjs-Cache", xCache);

    return { finished: false };
  }

  sendResponse(
    req: IncomingMessage,
    res: ServerResponse,
    url: string,
    extension: string,
    buffer: Buffer,
    isStatic: boolean,
    xCache: XCacheHeader,
    contentSecurityPolicy: string
  ) {
    const contentType = getContentType(extension);
    const etag = getHash([buffer]);
    const result = this.setResponseHeaders(req, res, url, etag, contentType, isStatic, xCache, contentSecurityPolicy);
    if (!result.finished) {
      res.end(buffer);
    }
  }

  parseCacheControl(str: string | null): Map<string, string> {
    const map = new Map<string, string>();
    if (!str) {
      return map;
    }
    for (let directive of str.split(",")) {
      let [key, value] = directive.trim().split("=");
      key = key.toLowerCase();
      if (value) {
        value = value.toLowerCase();
      }
      map.set(key, value);
    }
    return map;
  }

  /**
   * Inspects the first few bytes of a buffer to determine if
   * it matches the "magic number" of known file signatures.
   * https://en.wikipedia.org/wiki/List_of_file_signatures
   */
  detectContentType(buffer: Buffer) {
    if ([0xff, 0xd8, 0xff].every((b, i) => buffer[i] === b)) {
      return JPEG;
    }
    if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => buffer[i] === b)) {
      return PNG;
    }
    if ([0x47, 0x49, 0x46, 0x38].every((b, i) => buffer[i] === b)) {
      return GIF;
    }
    if ([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50].every((b, i) => !b || buffer[i] === b)) {
      return WEBP;
    }
    if ([0x3c, 0x3f, 0x78, 0x6d, 0x6c].every((b, i) => buffer[i] === b)) {
      return SVG;
    }
    if ([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66].every((b, i) => !b || buffer[i] === b)) {
      return AVIF;
    }
    return null;
  }

  getMaxAge(str: string | null): number {
    const map = this.parseCacheControl(str);
    if (map) {
      let age = map.get("s-maxage") || map.get("max-age") || "";
      if (age.startsWith('"') && age.endsWith('"')) {
        age = age.slice(1, -1);
      }
      const n = parseInt(age, 10);
      if (!isNaN(n)) {
        return n;
      }
    }
    return 0;
  }
}

function getSupportedMimeType(options: string[], accept = ""): string {
  const mimeType = mediaType(accept, options);
  return accept.includes(mimeType) ? mimeType : "";
}

function getHash(items: (string | number | Buffer)[]) {
  const hash = createHash("sha256");
  for (let item of items) {
    if (typeof item === "number") hash.update(String(item));
    else {
      hash.update(item);
    }
  }
  // See https://en.wikipedia.org/wiki/Base64#Filenames
  return hash.digest("base64").replace(/\//g, "-");
}

export async function resizeImage(
  content: Buffer,
  dimension: "width" | "height",
  size: number,
  // Should match VALID_BLUR_EXT
  extension: "avif" | "webp" | "png" | "jpeg",
  quality: number
): Promise<Buffer> {
  if (sharp) {
    const transformer = sharp(content);

    if (extension === "avif") {
      if (transformer.avif) {
        transformer.avif({ quality });
      } else {
        console.warn(
          chalk.yellow.bold("Warning: ") +
            `Your installed version of the 'sharp' package does not support AVIF images. Run 'yarn add sharp@latest' to upgrade to the latest version.`
        );
        transformer.webp({ quality });
      }
    } else if (extension === "webp") {
      transformer.webp({ quality });
    } else if (extension === "png") {
      transformer.png({ quality });
    } else if (extension === "jpeg") {
      transformer.jpeg({ quality });
    }
    if (dimension === "width") {
      transformer.resize(size);
    } else {
      transformer.resize(null, size);
    }
    const buf = await transformer.toBuffer();
    return buf;
  } else {
    const { ImagePool } = require("@squoosh/lib");
    const imagePool = new ImagePool(1);
    const image = imagePool.ingestImage(content);
    await image.preprocess({
      resize: {
        width: dimension === "width" ? size : undefined,
        height: dimension === "height" ? size : undefined,
      },
    });
    const encoderMap = {
      png: "oxipng",
      jpeg: "mozjpeg",
    } as Record<string, string>;
    const encorder = encoderMap[extension] || extension;
    await image.encode({
      [encorder]: {
        quality,
      },
    });
    const buf = (await image.encodedWith[encorder]).binary;
    await imagePool.close();
    return Buffer.from(buf);
  }
}

export async function getImageSize(
  buffer: Buffer,
  // Should match VALID_BLUR_EXT
  extension: "avif" | "webp" | "png" | "jpeg"
): Promise<{
  width?: number;
  height?: number;
}> {
  // TODO: upgrade "image-size" package to support AVIF
  // See https://github.com/image-size/image-size/issues/348
  if (extension === "avif") {
    if (sharp) {
      const transformer = sharp(buffer);
      const { width, height } = await transformer.metadata();
      return { width, height };
    } else {
      const { ImagePool } = require("@squoosh/lib");
      const imagePool = new ImagePool(1);
      const image = imagePool.ingestImage(buffer);
      const {
        bitmap: { width, height },
      } = await image.decoded;
      return { width, height };
    }
  }

  const { width, height } = imageSizeOf(buffer);
  return { width, height };
}
