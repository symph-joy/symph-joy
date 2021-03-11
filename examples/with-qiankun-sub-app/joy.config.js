const webpack = require('webpack')
const withCss = require('@symph/joy-css')
const withLess = require('@symph/joy-less')
const withImageLoader = require('@symph/joy-image')
const path = require('path')
const packageName = require('./package.json').name;

const assetPrefix = 'http://localhost:3000';
const publicRuntimeConfig =  {
  routePrefix: '/todos'
}

module.exports = {
  serverRender: false,
  plugins: [
    withCss(),
    withLess({cssModules: true}),
    withImageLoader({limit: 8192})
  ],
  assetPrefix,
  publicRuntimeConfig ,
  exportPathMap: async function (defaultPathMap) {
    return {
      '/': { page: '/', query: { title: 'basic example' } },
    }
  },
  webpack (config, {isServer, dir}) {
    if (!isServer){
      const originEntry = config.entry
      config.entry = async () => {
        const entries = {... (await originEntry()) }
        const mainEntryKey = 'static/runtime/main.js'
        let mainEntryFiles = [...entries[mainEntryKey]]
        mainEntryFiles.splice(mainEntryFiles.length - 1, 1,  path.join(dir, 'src/micro-app-joy-client.js'))
        entries[mainEntryKey] = mainEntryFiles
        return entries
      }

      config.output = {
        ...config.output,
        library: `${packageName}-[name]`,
        libraryTarget: 'umd',
        jsonpFunction: `webpackJsonp_${packageName}`,
        globalObject: 'window'
      }
    }

    return config
  }
}
