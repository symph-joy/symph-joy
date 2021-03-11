import { normalizePagePath, denormalizePagePath } from "./normalize-page-path";

export type BuildManifest = {
  commonFiles: readonly string[];

  devFiles: readonly string[];
  ampDevFiles: readonly string[];
  polyfillFiles: readonly string[];
  lowPriorityFiles: readonly string[];
  pages: {
    "/_app": readonly string[];
    [page: string]: readonly string[];
  };
  ampFirstPages: readonly string[];
};

export function getPageFiles(
  buildManifest: BuildManifest,
  page: string
): readonly string[] {
  const normalizedPage = denormalizePagePath(normalizePagePath(page));
  const commonFiles = buildManifest.commonFiles;
  const pageFiles = buildManifest.pages[normalizedPage] || [];

  const files = [...commonFiles, ...pageFiles];
  if (!files) {
    console.warn(
      `Could not find files for ${normalizedPage} in .next/build-manifest.json`
    );
    return [];
  }

  return files;
}
