import { promises, readFileSync, realpathSync } from "fs";
import { join } from "path";
import {
  PAGES_MANIFEST,
  SERVER_DIRECTORY,
  SERVERLESS_DIRECTORY,
  FONT_MANIFEST,
} from "../lib/constants";
import { normalizePagePath, denormalizePagePath } from "./normalize-page-path";
import { PagesManifest } from "../../build/webpack/plugins/pages-manifest-plugin";

export function pageNotFoundError(page: string): Error {
  const err: any = new Error(`Cannot find module for page: ${page}`);
  err.code = "ENOENT";
  return err;
}

export function getPagePath(page: string, distDir: string): string {
  const serverBuildPath = join(distDir, SERVER_DIRECTORY);
  const pagesManifestPath = join(serverBuildPath, PAGES_MANIFEST);
  let pagesManifest: PagesManifest;
  if (process.env.NODE_ENV === "test") {
    pagesManifest = JSON.parse(
      readFileSync(pagesManifestPath, { encoding: "utf-8" })
    );
  } else {
    pagesManifest = require(pagesManifestPath) as PagesManifest;
  }

  try {
    page = denormalizePagePath(normalizePagePath(page));
  } catch (err) {
    console.error(err);
    throw pageNotFoundError(page);
  }

  if (!pagesManifest[page]) {
    throw pageNotFoundError(page);
  }
  return join(serverBuildPath, pagesManifest[page]);
}

export function requirePage(
  page: string,
  distDir: string
  // serverless: boolean
): any {
  const pagePath = getPagePath(page, distDir);

  if (pagePath.endsWith(".html")) {
    return promises.readFile(pagePath, "utf8");
  }
  return require(pagePath);
}

export function requireFontManifest(distDir: string, serverless: boolean) {
  const serverBuildPath = join(
    distDir,
    serverless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY
  );
  const fontManifest = require(join(serverBuildPath, FONT_MANIFEST));
  return fontManifest;
}

export function requireJsonFile(filePath: string): Record<string, undefined> {
  if (process.env.NODE_ENV === "test") {
    return JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
  } else {
    return require(filePath);
  }
}
