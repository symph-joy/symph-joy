// @flow
import type { JoyConfig } from '../server/config'
import path from 'path'
import webpack from 'webpack'
import resolve from 'resolve'
import CaseSensitivePathPlugin from 'case-sensitive-paths-webpack-plugin'
import WriteFilePlugin from 'write-file-webpack-plugin'
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin'
import WebpackBar from 'webpackbar'
import { getErrorCompFilePath, getDocumentCompFilePath } from './webpack/utils'
import PagesPlugin from './webpack/plugins/pages-plugin'
import JoySsrImportPlugin from './webpack/plugins/joy-ssr-import'
import JoySSRModuleCachePlugin from './webpack/plugins/joyjs-ssr-module-cache'
import JoyRequireCacheHotReloader from './webpack/plugins/joy-require-cache-hot-reloader'
import UnlinkFilePlugin from './webpack/plugins/unlink-file-plugin'
import PagesManifestPlugin from './webpack/plugins/pages-manifest-plugin'
import BuildManifestPlugin from './webpack/plugins/build-manifest-plugin'
import ChunkNamesPlugin from './webpack/plugins/chunk-names-plugin'
import { ReactLoadablePlugin } from './webpack/plugins/react-loadable-plugin'
import {
  SERVER_DIRECTORY,
  JOY_PROJECT_ROOT,
  JOY_PROJECT_ROOT_NODE_MODULES,
  JOY_PROJECT_ROOT_DIST,
  DEFAULT_PAGES_DIR,
  REACT_LOADABLE_MANIFEST,
  CLIENT_STATIC_FILES_RUNTIME_WEBPACK,
  CLIENT_STATIC_FILES_RUNTIME_MAIN
} from '../lib/constants'
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import ClientGlobalComponentPlugin from './webpack/plugins/client-global-component-plugin'

// The externals config makes sure that
// on the server side when modules are
// in node_modules they don't get compiled by webpack
function externalsConfig (dir, isServer) {
  const externals = []

  if (!isServer) {
    return externals
  }

  externals.push((context, request, callback) => {
    resolve(request, { basedir: dir, preserveSymlinks: true }, (err, res) => {
      if (err) {
        return callback()
      }

      // Default pages have to be transpiled
      if (res.match(/node_modules[/\\]symph[/\\]joy[/\\]dist[/\\]pages/)) {
        return callback()
      }

      // Webpack itself has to be compiled because it doesn't always use module relative paths
      if (res.match(/node_modules[/\\]webpack/) || res.match(/node_modules[/\\]css-loader/)) {
        return callback()
      }

      if (res.match(/node_modules[/\\].*\.js$/)) {
        return callback(null, `commonjs ${request}`)
      }

      callback()
    })
  })

  return externals
}

function optimizationConfig ({ dir, dev, isServer, totalPages }) {
  if (isServer) {
    return {
      splitChunks: false,
      minimize: false
    }
  }

  const config: any = {
    splitChunks: {
      cacheGroups: {
        default: false,
        vendors: false
      }
    }
  }

  if (dev) {
    return config
  }

  // Terser is a better uglifier
  config.minimizer = [new TerserPlugin({
    parallel: true,
    sourceMap: false,
    cache: true
  })]

  // Only enabled in production
  // This logic will create a commons bundle
  // with modules that are used in 50% of all pages
  config.splitChunks.chunks = 'all'
  config.splitChunks.cacheGroups.commons = {
    name: 'commons',
    chunks: 'all',
    minChunks: totalPages > 2 ? totalPages * 0.5 : 2
  }

  return config
}

type BaseConfigContext = {|
  dev: boolean,
  isServer: boolean,
  buildId: string,
  config: JoyConfig
|}

export default async function getBaseWebpackConfig (dir: string, { dev = false, isServer = false, buildId, config }: BaseConfigContext) {
  const defaultLoaders = {
    babel: {
      loader: 'joy-babel-loader',
      options: { dev, isServer }
    },
    hotSelfAccept: {
      loader: 'hot-self-accept-loader',
      options: {
        include: [
          path.join(dir, 'pages'),
          path.join(dir, 'src')
        ],
        // All pages are javascript files. So we apply hot-self-accept-loader here to facilitate hot reloading of pages.
        // This makes sure plugins just have to implement `pageExtensions` instead of also implementing the loader
        extensions: new RegExp(`\\.+(${config.pageExtensions.join('|')})$`)
      }
    }
  }

  // Support for NODE_PATH
  const nodePathList = (process.env.NODE_PATH || '')
    .split(process.platform === 'win32' ? ';' : ':')
    .filter((p) => !!p)

  const distDir = path.join(dir, config.distDir)
  const outputPath = path.join(distDir, isServer ? SERVER_DIRECTORY : '')
  // const pagesEntries = await getPages(dir, {joyPagesDir: DEFAULT_PAGES_DIR, dev, buildId, isServer, pageExtensions: config.pageExtensions.join('|')})
  const totalPages = 1
  const appEntryFilePath = path.join(dir, config.main)
  const errorCompFilePath = getErrorCompFilePath({ dir, joyPagesDir: DEFAULT_PAGES_DIR })
  const documentCompFilePath = getDocumentCompFilePath({ dir, joyPagesDir: DEFAULT_PAGES_DIR })
  const entries = !isServer ? {
    // Backwards compatibility
    [CLIENT_STATIC_FILES_RUNTIME_MAIN]: [
      path.join(JOY_PROJECT_ROOT_DIST, 'client', 'init'),
      appEntryFilePath,
      errorCompFilePath,
      path.join(JOY_PROJECT_ROOT_DIST, 'client', (dev ? 'joy-dev' : 'joy'))
    ].filter(Boolean)
  } : {
    'app-main.js': appEntryFilePath,
    '_document.js': documentCompFilePath,
    '_error.js': errorCompFilePath
  }

  const resolveConfig = {
    extensions: ['.wasm', '.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [
      JOY_PROJECT_ROOT_NODE_MODULES,
      'node_modules',
      ...nodePathList // Support for NODE_PATH environment variable
    ],
    alias: {
      '@symph/joy': JOY_PROJECT_ROOT
    }
  }

  const webpackMode = dev ? 'development' : 'production'

  let webpackConfig = {
    mode: webpackMode,
    devtool: dev ? 'cheap-module-source-map' : false,
    name: isServer ? 'server' : 'client',
    cache: true,
    target: isServer ? 'node' : 'web',
    externals: externalsConfig(dir, isServer),
    optimization: optimizationConfig({ dir, dev, isServer, totalPages }),
    recordsPath: path.join(outputPath, 'records.json'),
    context: dir,
    // Kept as function to be backwards compatible
    entry: async () => {
      return {
        ...entries
      }
    },
    output: {
      path: outputPath,
      filename: ({ chunk }) => {
        // Use `[name]-[contenthash].js` in production
        if (!dev && (chunk.name === CLIENT_STATIC_FILES_RUNTIME_MAIN || chunk.name === CLIENT_STATIC_FILES_RUNTIME_WEBPACK)) {
          return chunk.name.replace(/\.js$/, '-[contenthash].js')
        }
        return '[name]'
      },
      libraryTarget: isServer ? 'commonjs2' : 'jsonp',
      hotUpdateChunkFilename: 'static/webpack/[id].[hash].hot-update.js',
      hotUpdateMainFilename: 'static/webpack/[hash].hot-update.json',
      // This saves chunks with the name given via `import()`
      chunkFilename: isServer ? `${dev ? '[name]' : '[name].[contenthash]'}.js` : `static/chunks/${dev ? '[name]' : '[name].[contenthash]'}.js`,
      strictModuleExceptionHandling: true
    },
    performance: { hints: false },
    resolve: resolveConfig,
    resolveLoader: {
      modules: [
        JOY_PROJECT_ROOT_NODE_MODULES,
        'node_modules',
        path.join(__dirname, 'webpack', 'loaders'), // The loaders joy provides
        ...nodePathList // Support for NODE_PATH environment variable
      ]
    },
    module: {
      rules: [
        dev && !isServer && {
          test: defaultLoaders.hotSelfAccept.options.extensions,
          include: defaultLoaders.hotSelfAccept.options.include,
          use: defaultLoaders.hotSelfAccept
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [dir],
          exclude: /node_modules/,
          use: defaultLoaders.babel
        }
      ].filter(Boolean)
    },
    plugins: [
      dev && !isServer && new HardSourceWebpackPlugin({}),
      // This plugin makes sure `output.filename` is used for entry chunks
      new ChunkNamesPlugin({ dev }),
      !isServer && new ReactLoadablePlugin({
        filename: REACT_LOADABLE_MANIFEST
      }),
      new WebpackBar({
        name: isServer ? 'server' : 'client'
      }),
      dev && !isServer && new FriendlyErrorsWebpackPlugin(),
      new webpack.IgnorePlugin(/(precomputed)/, /node_modules.+(elliptic)/),
      // Even though require.cache is server only we have to clear assets from both compilations
      // This is because the client compilation generates the build manifest that's used on the server side
      dev && new JoyRequireCacheHotReloader(),
      dev && !isServer && new webpack.HotModuleReplacementPlugin({ multiStep: true }),
      dev && new webpack.NoEmitOnErrorsPlugin(),
      dev && new UnlinkFilePlugin(),
      dev && new CaseSensitivePathPlugin(), // Since on macOS the filesystem is case-insensitive this will make sure your path are case-sensitive
      dev && new WriteFilePlugin({
        exitOnErrors: false,
        log: false,
        // required not to cache removed files
        useHashIndex: false
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production')
      }),
      // This is used in client/dev-error-overlay/hot-dev-client.js to replace the dist directory
      !isServer && dev && new webpack.DefinePlugin({
        'process.env.__JOY_DIST_DIR': JSON.stringify(distDir)
      }),
      !dev && new webpack.optimize.ModuleConcatenationPlugin(),
      isServer && new PagesManifestPlugin(),
      !isServer && new BuildManifestPlugin(),
      !isServer && new ClientGlobalComponentPlugin({ sourceFilePath: appEntryFilePath, globalName: '__JOY_APP_MAIN' }),
      !isServer && new ClientGlobalComponentPlugin({ sourceFilePath: errorCompFilePath, globalName: '__JOY_ERROR' }),
      !isServer && new PagesPlugin(),
      isServer && new JoySsrImportPlugin(),
      isServer && new JoySSRModuleCachePlugin({ outputPath })
    ].filter(Boolean)
  }

  if (typeof config.webpack === 'function') {
    webpackConfig = config.webpack(webpackConfig, { dir, dev, isServer, buildId, config, defaultLoaders, totalPages })
  }

  return webpackConfig
}
