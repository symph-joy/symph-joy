import findUp from 'find-up'
import { CONFIG_FILE } from '../lib/constants'

const defaultConfig = {
  main: 'src/index.js',
  serverRender: true,
  webpack: null,
  webpackDevMiddleware: null,
  poweredByHeader: true,
  distDir: '.joy',
  assetPrefix: '',
  configOrigin: 'default',
  useFileSystemPublicRoutes: true,
  pageExtensions: ['jsx', 'js'], // jsx before js because otherwise regex matching will match js first
  exportPathMap: async () => {
    return {
      '/': {page: '/'}
    }
  }
}

export default function getConfig (phase, dir, customConfig) {
  return loadConfig(phase, dir, customConfig)
}

export function loadConfig (phase, dir, customConfig) {
  if (customConfig && typeof customConfig === 'object') {
    customConfig.configOrigin = 'server'
    return preparePlugins({...defaultConfig, ...customConfig})
  }
  const path = findUp.sync(CONFIG_FILE, {
    cwd: dir
  })

// If config file was found
  if (path && path.length) {
    const userConfigModule = require(path)
    const userConfigInitial = userConfigModule.default || userConfigModule
    if (typeof userConfigInitial === 'function') {
      return preparePlugins({...defaultConfig, configOrigin: CONFIG_FILE, ...userConfigInitial(phase, {defaultConfig})})
    }

    return preparePlugins({...defaultConfig, configOrigin: CONFIG_FILE, ...userConfigInitial})
  }

  return defaultConfig
}

function preparePlugins (config) {
  if (config.plugins) {
    let webpackConfig = {...config}
    if (!Array.isArray(config.plugins)) {
      throw new Error(`in ${CONFIG_FILE}, the plugins config value must is a Array, or empty`)
    }

    config.plugins.forEach(plugin => {
      webpackConfig = plugin(webpackConfig)
    })
    return webpackConfig
  }
  return config
}
