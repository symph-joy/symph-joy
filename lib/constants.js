import { join } from 'path'
export const PHASE_EXPORT = 'phase-export'
export const PHASE_PRODUCTION_BUILD = 'phase-production-build'
export const PHASE_PRODUCTION_SERVER = 'phase-production-server'
export const PHASE_DEVELOPMENT_SERVER = 'phase-development-server'
export const PAGES_MANIFEST = 'pages-manifest.json'
export const BUILD_MANIFEST = 'build-manifest.json'
export const REACT_LOADABLE_MANIFEST = 'react-loadable-manifest.json'
export const SERVER_DIRECTORY = 'server'
export const CONFIG_FILE = 'joy.config.js'
export const BUILD_ID_FILE = 'BUILD_ID'
// this path will return 404 directly
export const BLOCKED_PAGES = [
  // '/_app',
]
// matches static/<buildid>/pages/<page>.js
export const IS_BUNDLED_PAGE_REGEX = /^static[/\\][^/\\]+[/\\]pages.*\.js$/
// matches static/<buildid>/pages/:page*.js
export const ROUTE_NAME_REGEX = /^static[/\\][^/\\]+[/\\]pages[/\\](.*)\.js$/
export const JOY_PROJECT_ROOT = join(__dirname, '..', '..')
export const JOY_PROJECT_ROOT_DIST = join(JOY_PROJECT_ROOT, 'dist')
export const JOY_PROJECT_ROOT_NODE_MODULES = join(JOY_PROJECT_ROOT, 'node_modules')
export const DEFAULT_PAGES_DIR = join(JOY_PROJECT_ROOT_DIST, 'pages')
export const CLIENT_STATIC_FILES_PATH = 'static'
export const CLIENT_STATIC_FILES_RUNTIME = 'runtime'
export const CLIENT_STATIC_FILES_RUNTIME_PATH = `${CLIENT_STATIC_FILES_PATH}/${CLIENT_STATIC_FILES_RUNTIME}`
// static/runtime/main.js
export const CLIENT_STATIC_FILES_RUNTIME_MAIN = `${CLIENT_STATIC_FILES_RUNTIME_PATH}/main.js`
// static/runtime/webpack.js
export const CLIENT_STATIC_FILES_RUNTIME_WEBPACK = `${CLIENT_STATIC_FILES_RUNTIME_PATH}/webpack.js`
