import path from "path";
import fs from "fs";
// import promisify from '../../lib/promisify'
// import globModule from 'glob'
// import { CLIENT_STATIC_FILES_PATH } from '../../lib/constants'

// const glob = promisify(globModule)

// export async function getPages (dir, {joyPagesDir, dev, buildId, isServer, pageExtensions}) {
//   const pageFiles = await getPagePaths(dir, {dev, isServer, pageExtensions})
//
//   return getPageEntries(pageFiles, {joyPagesDir, buildId, isServer, pageExtensions})
// }
//
// export async function getPagePaths (dir, {dev, isServer, pageExtensions}) {
//   let pages
//
//   if (dev) {
//     // In development we only compile _document.js, _error.js and _app.js when starting, since they're always needed. All other pages are compiled with on demand entries
//     pages = await glob(isServer ? `pages/+(_document|_app|_error).+(${pageExtensions})` : `pages/+(_app|_error).+(${pageExtensions})`, {cwd: dir})
//   } else {
//     // In production get all pages from the pages directory
//     pages = await glob(isServer ? `pages/**/*.+(${pageExtensions})` : `pages/**/!(_document)*.+(${pageExtensions})`, {cwd: dir})
//   }
//
//   return pages
// }
//
// // Convert page path into single entry
// export function createEntry (filePath, {buildId = '', name, pageExtensions} = {}) {
//   const parsedPath = path.parse(filePath)
//   let entryName = name || filePath
//
//   // This makes sure we compile `pages/blog/index.js` to `pages/blog.js`.
//   // Excludes `pages/index.js` from this rule since we do want `/` to route to `pages/index.js`
//   if (parsedPath.dir !== 'pages' && parsedPath.name === 'index') {
//     entryName = `${parsedPath.dir}.js`
//   }
//
//   // Makes sure supported extensions are stripped off. The outputted file should always be `.js`
//   if (pageExtensions) {
//     entryName = entryName.replace(new RegExp(`\\.+(${pageExtensions})$`), '.js')
//   }
//
//   return {
//     name: path.join(CLIENT_STATIC_FILES_PATH, buildId, entryName),
//     files: [parsedPath.root ? filePath : `./${filePath}`] // The entry always has to be an array.
//   }
// }
//
// // Convert page paths into entries
// export function getPageEntries (pagePaths, {joyPagesDir, buildId, isServer = false, pageExtensions} = {}) {
//   const entries = {}
//
//   for (const filePath of pagePaths) {
//     const entry = createEntry(filePath, {pageExtensions, buildId})
//     entries[entry.name] = entry.files
//   }
//
//   // const appPagePath = path.join(joyPagesDir, '_app.js')
//   // const appPageEntry = createEntry(appPagePath, {buildId, name: 'pages/_app.js'}) // default app.js
//   // if (!entries[appPageEntry.name]) {
//   //   entries[appPageEntry.name] = appPageEntry.files
//   // }
//
//   const errorPagePath = path.join(joyPagesDir, '_error.js')
//   const errorPageEntry = createEntry(errorPagePath, {buildId, name: 'pages/_error.js'}) // default error.js
//   if (!entries[errorPageEntry.name]) {
//     entries[errorPageEntry.name] = errorPageEntry.files
//   }
//
//   if (isServer) {
//     const documentPagePath = path.join(joyPagesDir, '_document.js')
//     const documentPageEntry = createEntry(documentPagePath, {buildId, name: 'pages/_document.js'}) // default _document.js
//     if (!entries[documentPageEntry.name]) {
//       entries[documentPageEntry.name] = documentPageEntry.files
//     }
//   }
//
//   return entries
// }

export function getErrorCompFilePath({
  dir,
  joyPagesDir,
}: {
  dir: string;
  joyPagesDir: string;
}): string {
  let filePath = null;
  if (fs.existsSync(path.join(dir, "src/_error.js"))) {
    filePath = path.join(dir, "src/_error.js");
  } else if (fs.existsSync(path.join(dir, "pages/_error.js"))) {
    // deprecation
    filePath = path.join(dir, "pages/_error.js");
  } else {
    filePath = path.join(joyPagesDir, "_error.js");
  }
  return filePath;
}

export function getDocumentCompFilePath({
  dir,
  joyPagesDir,
}: {
  dir: string;
  joyPagesDir: string;
}): string {
  let filePath = null;
  if (fs.existsSync(path.join(dir, "src/_document.js"))) {
    filePath = path.join(dir, "src/_document.js");
  } else if (fs.existsSync(path.join(dir, "pages/_document.js"))) {
    // deprecation
    filePath = path.join(dir, "pages/_document.js");
  } else {
    filePath = path.join(joyPagesDir, "_document.js");
  }
  return filePath;
}
