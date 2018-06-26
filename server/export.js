import del from 'del'
import cp from 'recursive-copy'
import mkdirp from 'mkdirp-then'
import walk from 'walk'
import { extname, resolve, join, dirname, sep } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import getConfig from './config'
import {PHASE_EXPORT, CONFIG_FILE} from '../lib/constants'
import { renderToHTML } from './render'
import { getAvailableChunks } from './utils'
import { printAndExit } from '../lib/utils'
import { setAssetPrefix } from '../lib/asset'
import * as envConfig from '../lib/runtime-config'

export default async function (dir, options, configuration) {
  dir = resolve(dir)
  const symphonyConfig = configuration || getConfig(PHASE_EXPORT, dir)
  const symphonyDir = join(dir, symphonyConfig.distDir)

  log(`  using build directory: ${symphonyDir}`)

  if (!existsSync(symphonyDir)) {
    console.error(
      `Build directory ${symphonyDir} does not exist. Make sure you run "joy build" before running "joy start" or "joy export".`
    )
    process.exit(1)
  }

  const buildId = readFileSync(join(symphonyDir, 'BUILD_ID'), 'utf8')

  // Initialize the output directory
  const outDir = options.outdir
  await del(join(outDir, '*'))
  await mkdirp(join(outDir, '_symphony', buildId))

  // Copy static directory
  if (existsSync(join(dir, 'static'))) {
    log('  copying "static" directory')
    await cp(
      join(dir, 'static'),
      join(outDir, 'static'),
      { expand: true }
    )
  }

  // Copy main.js
  await cp(
    join(symphonyDir, 'main.js'),
    join(outDir, '_symphony', buildId, 'main.js')
  )

  // Copy .symphony/static directory
  if (existsSync(join(symphonyDir, 'static'))) {
    log('  copying "static build" directory')
    await cp(
      join(symphonyDir, 'static'),
      join(outDir, '_symphony', 'static')
    )
  }

  // Copy dynamic import chunks
  if (existsSync(join(symphonyDir, 'chunks'))) {
    log('  copying dynamic import chunks')

    await mkdirp(join(outDir, '_symphony', 'webpack'))
    await cp(
      join(symphonyDir, 'chunks'),
      join(outDir, '_symphony', 'webpack', 'chunks')
    )
  }

  await copyPages(symphonyDir, outDir, buildId)

  // Get the exportPathMap from the `joy.config.js`
  if (typeof symphonyConfig.exportPathMap !== 'function') {
    printAndExit(
      `> No "exportPathMap" found in "${CONFIG_FILE}"`
    )
  }

  const exportPathMap = await symphonyConfig.exportPathMap()
  const exportPaths = Object.keys(exportPathMap)

  // Start the rendering process
  const renderOpts = {
    ComponentPath: resolve(dir, symphonyConfig.distDir, './dist', './app-main.js'),
    dir,
    dist: symphonyConfig.distDir,
    buildId,
    joyExport: true,
    assetPrefix: symphonyConfig.assetPrefix.replace(/\/$/, ''),
    dev: false,
    staticMarkup: false,
    hotReloader: null,
    availableChunks: getAvailableChunks(dir, symphonyConfig.distDir)
  }

  const {serverRuntimeConfig, publicRuntimeConfig} = symphonyConfig

  if (publicRuntimeConfig) {
    renderOpts.runtimeConfig = publicRuntimeConfig
  }

  envConfig.setConfig({
    serverRuntimeConfig,
    publicRuntimeConfig
  })

  // set the assetPrefix to use for 'symphony/asset'
  setAssetPrefix(renderOpts.assetPrefix)

  // We need this for server rendering the Link component.
  global.__SYMPHONY_DATA__ = {
    joyExport: true
  }

  for (const path of exportPaths) {
    log(`  exporting path: ${path}`)
    if (!path.startsWith('/')) {
      throw new Error(`path "${path}" doesn't start with a backslash`)
    }

    const { page, query = {} } = exportPathMap[path] || {}
    const req = { url: path }
    const res = {}

    let htmlFilename = `${path}${sep}index.html`
    if (extname(path) !== '') {
      // If the path has an extension, use that as the filename instead
      htmlFilename = path
    } else if (path === '/') {
      // If the path is the root, just use index.html
      htmlFilename = 'index.html'
    }
    const baseDir = join(outDir, dirname(htmlFilename))
    const htmlFilepath = join(outDir, htmlFilename)

    await mkdirp(baseDir)

    const html = await renderToHTML(req, res, page, query, renderOpts)
    writeFileSync(htmlFilepath, html, 'utf8')
  }

  // Add an empty line to the console for the better readability.
  log('')

  function log (message) {
    if (options.silent) return
    console.log(message)
  }
}

function copyPages (symphonyDir, outDir, buildId) {
  // TODO: do some proper error handling
  return new Promise((resolve, reject) => {
    const symphonyBundlesDir = join(symphonyDir, 'bundles', 'pages')
    const walker = walk.walk(symphonyBundlesDir, { followLinks: false })

    walker.on('file', (root, stat, next) => {
      const filename = stat.name
      const fullFilePath = `${root}${sep}${filename}`
      const relativeFilePath = fullFilePath.replace(symphonyBundlesDir, '')

      // We should not expose this page to the client side since
      // it has no use in the client side.
      if (relativeFilePath === `${sep}_document.js`) {
        next()
        return
      }

      let destFilePath = null
      if (relativeFilePath === `${sep}index.js`) {
        destFilePath = join(outDir, '_symphony', buildId, 'page', relativeFilePath)
      } else if (/index\.js$/.test(filename)) {
        const newRelativeFilePath = relativeFilePath.replace(`${sep}index.js`, '.js')
        destFilePath = join(outDir, '_symphony', buildId, 'page', newRelativeFilePath)
      } else {
        destFilePath = join(outDir, '_symphony', buildId, 'page', relativeFilePath)
      }

      cp(fullFilePath, destFilePath)
        .then(next)
        .catch(reject)
    })

    walker.on('end', resolve)
  })
}
