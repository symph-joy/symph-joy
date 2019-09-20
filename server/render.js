import { join } from 'path'
import React from 'react'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import send from 'send'
import generateETag from 'etag'
import fresh from 'fresh'
// import { normalizePagePath } from './require'
import { loadGetInitialProps, isResSent } from '../lib/utils'
import Head, { defaultHead } from '../lib/head'
import ErrorDebug from '../lib/error-debug'
import Loadable from '../lib/loadable'
import LoadableCapture from '../lib/loadable-capture'
import { BUILD_MANIFEST, REACT_LOADABLE_MANIFEST, SERVER_DIRECTORY } from '../lib/constants'
import { stringify } from 'querystring'

import { create as createTempo } from '@symph/tempo'
import { createServerRouter } from '../lib/router'

// Based on https://github.com/jamiebuilds/react-loadable/pull/132
function getDynamicImportBundles (manifest, moduleIds) {
  const filesMap = {}
  const bundles = []
  moduleIds.forEach((moduleId) => {
    const moduleBundles = manifest[moduleId]
    if (typeof moduleBundles === 'undefined' || moduleBundles.length === 0) {
      return
    }
    for (let i = 0; i < moduleBundles.length; i++) {
      const bundle = moduleBundles[i]
      if (filesMap[bundle.file]) {
        continue
      }
      filesMap[bundle.file] = bundle
      bundles.push(bundle)
    }
  })
  return bundles
}

const logger = console

export class ErrorRender extends Error {
  constructor (staticRenderContext, html) {
    super()
    this.statusCode = staticRenderContext.status
    this.context = staticRenderContext
    this.html = html
  }
}

export async function render (req, res, pathname, query, opts) {
  const html = await renderToHTML(req, res, pathname, query, opts)
  sendHTML(req, res, html, req.method, opts)
}

export function renderToHTML (req, res, pathname, query, opts) {
  return doRender(req, res, pathname, query, opts)
}

export async function renderError (err, req, res, pathname, query, opts) {
  const html = await renderErrorToHTML(err, req, res, query, opts)
  sendHTML(req, res, html, req.method, opts)
}

export function renderErrorToHTML (err, req, res, pathname, query, opts = {}) {
  const { distDir } = opts
  const errorPath = join(distDir, SERVER_DIRECTORY, '_error')
  return doRender(req, res, pathname, query, { ...opts, err, ComponentPath: errorPath })
}

// function getPageFiles (buildManifest, page) {
//   const normalizedPage = normalizePagePath(page)
//   const files = buildManifest.pages[normalizedPage]
//   if (!files) {
//     console.warn(`Could not find files for ${normalizedPage} in .joy/build-manifest.json`)
//     return []
//   }
//   return files
// }

async function doRender (req, res, pathname, query, {
  err,
  page,
  serverRender = true,
  ComponentPath,
  buildId,
  hotReloader,
  assetPrefix,
  runtimeConfig,
  distDir,
  dir,
  dev = false,
  staticMarkup = false,
  joyExport = false
} = {}) {
  console.log(`> start render, pathname:${pathname}${err ? ', error:' + err : ''}`)
  page = page || pathname
  const serializedErr = (err) ? serializeError(res, dev, err) : undefined

  // 暂时不需要监听页面的编译情况
  // if (hotReloader) { // In dev mode we use on demand entries to compile the page before rendering
  //   await ensurePage(page, { dir, hotReloader })
  // }

  const documentPath = join(distDir, SERVER_DIRECTORY, '_document')
  // const appPath = join(distDir, SERVER_DIRECTORY, CLIENT_STATIC_FILES_PATH, buildId, 'pages', '_app')
  let App = require('../lib/app')
  let [buildManifest, reactLoadableManifest, Document] = await Promise.all([
    require(join(distDir, BUILD_MANIFEST)),
    require(join(distDir, REACT_LOADABLE_MANIFEST)),
    require(documentPath)
    // require(appPath)
  ])

  App = App.default || App
  Document = Document.default || Document
  const asPath = req.url
  const ctx = { err, req, res, pathname, query, asPath }
  // const props = await loadGetInitialProps(App, {Component, router, ctx})
  const devFiles = buildManifest.devFiles
  const files = [
    ...new Set([
      ...buildManifest.files
      // ...getPageFiles(buildManifest, page),
      // ...getPageFiles(buildManifest, '/_app'),
      // ...getPageFiles(buildManifest, '/_error')
    ])
  ]

  // the response might be finshed on the getinitialprops call
  if (isResSent(res)) return

  const renderContext = {}
  const reactLoadableModules = []
  const renderPage = async (options = Comp => Comp) => {
    let EnhancedApp = App

    const Router = createServerRouter({ pathname, search: (query ? stringify(query) : '') }, renderContext)
    if (typeof options === 'object') {
      if (options.enhanceApp) {
        EnhancedApp = options.enhanceApp(App)
      }
    }
    const requireComp = async function () {
      let EnhancedComponent = null
      let Component = require(ComponentPath)
      Component = Component.default || Component

      // For backwards compatibility
      if (typeof options === 'function') {
        EnhancedComponent = options(Component)
      } else if (typeof options === 'object') {
        if (options.enhanceComponent) {
          EnhancedComponent = options.enhanceComponent(Component)
        }
      }

      await Loadable.preloadAll() // Make sure all dynamic imports are loaded

      return EnhancedComponent
    }

    const createApp = (appProps, shouldGatherModules) => {
      return (
        <LoadableCapture
          report={moduleName => shouldGatherModules ? reactLoadableModules.push(moduleName) : undefined}
        >
          <EnhancedApp {...appProps} />
        </LoadableCapture>)
    }

    const render = staticMarkup ? renderToStaticMarkup : renderToString

    let html
    let initStoreState

    if (err && dev) {
      html = render(<ErrorDebug error={err} />)
    } else {
      if (serverRender) {
        const Component = await requireComp()
        const tempo = createTempo({})
        tempo.start()

        const appContentProps = {}
        if (err) {
          Object.assign(appContentProps, { ...serializedErr })
        }
        const appProps = { Component, Router, tempo, appContentProps }

        // 第一次渲染，执行当前页面中所有组件的componentWillMount事件，dispatch redux的action，开始执行操作，
        // 等所有异步操作完成以后，redux state的状态已更新完成后，执行第二次渲染
        renderToStaticMarkup(createApp(appProps, false))

        await tempo.prepareManager.waitAllPrepareFinished()
        await tempo.dispatch({
          type: '@@joy/updatePrepareState',
          isPrepared: true
        })

        // 第二次渲染，此时store的state已经获取数据完成
        html = render(createApp(appProps, true))
        initStoreState = tempo._store.getState()
      } else {
        html = ''
      }
    }
    const head = Head.rewind() || defaultHead()

    return { html, head, buildManifest, initStoreState }
  }

  const docProps = await loadGetInitialProps(Document, { ...ctx, renderPage })
  const dynamicImports = getDynamicImportBundles(reactLoadableManifest, reactLoadableModules)

  if (isResSent(res)) return

  if (!Document.prototype || !Document.prototype.isReactComponent) throw new Error('_document.js is not exporting a React component')
  const doc = (
    <Document {...{
      __JOY_DATA__: {
        page, // The rendered page
        pathname, // The requested path
        query, // querystring parsed / passed by the user
        buildId, // buildId is used to facilitate caching of page bundles, we send it to the client so that pageloader knows where to load bundles
        assetPrefix: assetPrefix === '' ? undefined : assetPrefix, // send assetPrefix to the client side when configured, otherwise don't sent in the resulting HTML
        runtimeConfig, // runtimeConfig if provided, otherwise don't sent in the resulting HTML
        joyExport, // If this is a page exported by `joy export`
        err: serializedErr, // Error if one happened, otherwise don't sent in the resulting HTML
        initStoreState: docProps.initStoreState
      },
      dev,
      dir,
      staticMarkup,
      buildManifest,
      devFiles,
      files,
      dynamicImports,
      assetPrefix, // We always pass assetPrefix as a top level property since _document needs it to render, even though the client side might not need it
      ...docProps
    }}
    />)

  const pageHtml = '<!DOCTYPE html>' + renderToStaticMarkup(doc)

  checkRenderState(req, res, renderContext, pageHtml)

  return pageHtml
}

function checkRenderState (req, res, staticContext, html) {
  if (Object.keys(staticContext).length === 0 ||
    (staticContext.status >= 200 && staticContext.status <= 299)) {
    return false
  } else {
    throw new ErrorRender(staticContext, html)
  }
}

export async function renderScriptError (req, res, page, error) {
  // Asks CDNs and others to not to cache the errored page
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')

  if (error.code === 'ENOENT' || error.message === 'INVALID_BUILD_ID') {
    res.statusCode = 404
    res.end('404 - Not Found')
    return
  }

  logger.error(error.stack)
  res.statusCode = 500
  res.end('500 - Internal Error')
}

export function sendHTML (req, res, html, method, { dev, generateEtags }) {
  if (isResSent(res)) return
  const etag = generateEtags && generateETag(html)

  if (fresh(req.headers, { etag })) {
    res.statusCode = 304
    res.end()
    return
  }

  if (dev) {
    // In dev, we should not cache pages for any reason.
    // That's why we do this.
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
  }

  if (etag) {
    res.setHeader('ETag', etag)
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(method === 'HEAD' ? null : html)
}

function errorToJSON (err) {
  const { name, message, stack } = err
  const json = { name, message, stack }

  if (err.module) {
    // rawRequest contains the filename of the module which has the error.
    const { rawRequest } = err.module
    json.module = { rawRequest }
  }

  return json
}

function serializeError (res, dev, err) {
  if (dev) {
    return errorToJSON(err)
  }
  const statusCode = res.statusCode || err.statusCode || 500
  const message = err.message || '500 - Internal Server Error.'
  return { statusCode, message }
}

export function serveStatic (req, res, path) {
  return new Promise((resolve, reject) => {
    send(req, path)
      .on('directory', () => {
        // We don't allow directories to be read.
        const err = new Error('No directory access')
        err.code = 'ENOENT'
        reject(err)
      })
      .on('error', reject)
      .pipe(res)
      .on('finish', resolve)
  })
}

// async function ensurePage (page, {dir, hotReloader}) {
//   if (page === '/_error') return
//
//   await hotReloader.ensurePage(page)
// }
