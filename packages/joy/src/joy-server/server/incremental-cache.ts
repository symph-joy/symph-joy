import { promises, readFileSync } from "fs";
import LRUCache from "lru-cache";
import path from "path";
import { PrerenderManifest } from "../../build/joy-build.service";
import { PRERENDER_MANIFEST } from "../lib/constants";
import { normalizePagePath } from "./normalize-page-path";

function toRoute(pathname: string): string {
  return pathname.replace(/\/$/, "").replace(/\/index$/, "") || "/";
}

type IncrementalCacheValue = {
  html: string;
  pageData: any;
  isStale?: boolean;
  curRevalidate?: number | false;
  // milliseconds to revalidate after
  revalidateAfter: number | false;
};

export class IncrementalCache {
  incrementalOptions: {
    flushToDisk?: boolean;
    pagesDir?: string;
    distDir?: string;
    dev?: boolean;
  };

  prerenderManifest: PrerenderManifest;
  cache: LRUCache<string, IncrementalCacheValue>;

  constructor({
    max,
    dev,
    distDir,
    pagesDir,
    flushToDisk,
  }: {
    dev: boolean;
    max?: number;
    distDir: string;
    pagesDir: string;
    flushToDisk?: boolean;
  }) {
    this.incrementalOptions = {
      dev,
      distDir,
      pagesDir,
      flushToDisk: !dev && (typeof flushToDisk !== "undefined" ? flushToDisk : true),
    };

    if (dev) {
      this.prerenderManifest = {
        version: -1 as any, // letting us know this doesn't conform to spec
        routes: {},
        dynamicRoutes: {},
        preview: null as any, // `preview` is special case read in joy-dev-server
        apis: [],
      };
    } else {
      this.prerenderManifest = JSON.parse(readFileSync(path.join(distDir, PRERENDER_MANIFEST), "utf8"));
    }

    this.cache = new LRUCache({
      // default to 50MB limit
      max: max || 50 * 1024 * 1024,
      length(val: any) {
        // rough estimate of size of cache value
        return val.html.length + JSON.stringify(val.pageData).length;
      },
    });
  }

  private getSeedPath(pathname: string, ext: string): string {
    return path.join(this.incrementalOptions.pagesDir!, `${pathname}.${ext}`);
  }

  private calculateRevalidate(pathname: string): number | false {
    pathname = toRoute(pathname);

    // in development we don't have a prerender-manifest
    // and default to always revalidating to allow easier debugging
    const curTime = new Date().getTime();
    if (this.incrementalOptions.dev) return curTime - 1000;

    const { initialRevalidateSeconds } = this.prerenderManifest.routes[pathname] || {
      initialRevalidateSeconds: 1,
    };
    const revalidateAfter = typeof initialRevalidateSeconds === "number" ? initialRevalidateSeconds * 1000 + curTime : initialRevalidateSeconds;

    return revalidateAfter;
  }

  getFallback(page: string): Promise<string> {
    page = normalizePagePath(page);
    return promises.readFile(this.getSeedPath(page, "html"), "utf8");
  }

  // get data from cache if available
  async get(pathname: string): Promise<IncrementalCacheValue | void> {
    if (this.incrementalOptions.dev) return;
    pathname = normalizePagePath(pathname);

    let data = this.cache.get(pathname);

    // let's check the disk for seed data
    if (!data) {
      try {
        // todo 优化：当缓存不存在时，减少磁盘的反问次数。
        const html = await promises.readFile(this.getSeedPath(pathname, "html"), "utf8");
        const pageData = JSON.parse(await promises.readFile(this.getSeedPath(pathname, "json"), "utf8"));

        data = {
          html,
          pageData,
          revalidateAfter: this.calculateRevalidate(pathname),
        };
        this.cache.set(pathname, data);
      } catch (_) {
        // unable to get data from disk
      }
    }

    if (data && data.revalidateAfter !== false && data.revalidateAfter < new Date().getTime()) {
      data.isStale = true;
    }
    const manifestEntry = this.prerenderManifest.routes[pathname];

    if (data && manifestEntry) {
      data.curRevalidate = manifestEntry.initialRevalidateSeconds;
    }
    return data;
  }

  // populate the incremental cache with new data
  async set(
    pathname: string,
    data: {
      html: string;
      pageData: any;
    },
    revalidateSeconds?: number | false
  ) {
    if (this.incrementalOptions.dev) return;
    if (typeof revalidateSeconds !== "undefined") {
      // TODO: Update this to not mutate the manifest from the
      // build.
      this.prerenderManifest.routes[pathname] = {
        dataRoute: path.posix.join("/_joy/data", `${normalizePagePath(pathname)}.json`),
        srcRoute: null, // FIXME: provide actual source route, however, when dynamically appending it doesn't really matter
        initialRevalidateSeconds: revalidateSeconds,
      };
    }

    pathname = normalizePagePath(pathname);
    this.cache.set(pathname, {
      ...data,
      revalidateAfter: this.calculateRevalidate(pathname),
    });

    // TODO: This option needs to cease to exist unless it stops mutating the
    // `joy build` output's manifest.
    if (this.incrementalOptions.flushToDisk) {
      try {
        const seedPath = this.getSeedPath(pathname, "html");
        await promises.mkdir(path.dirname(seedPath), { recursive: true });
        await promises.writeFile(seedPath, data.html, "utf8");
        await promises.writeFile(this.getSeedPath(pathname, "json"), JSON.stringify(data.pageData), "utf8");
      } catch (error) {
        // failed to flush to disk
        console.warn("Failed to update prerender files for", pathname, error);
      }
    }
  }
}
