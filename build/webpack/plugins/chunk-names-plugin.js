// This plugin mirrors webpack 3 `filename` and `chunkfilename` behavior
// This fixes https://github.com/webpack/webpack/issues/6598
// This plugin is based on https://github.com/researchgate/webpack/commit/2f28947fa0c63ccbb18f39c0098bd791a2c37090
export default class ChunkNamesPlugin {
  constructor ({ dev }) {
    this.dev = dev
  }

  apply (compiler) {
    const me = this
    compiler.hooks.compilation.tap('JoyChunkNamesPlugin', (compilation) => {
      compilation.chunkTemplate.hooks.renderManifest.intercept({
        register (tapInfo) {
          if (tapInfo.name === 'JavascriptModulesPlugin') {
            const originalMethod = tapInfo.fn
            tapInfo.fn = function (result, options) {
              let filenameTemplate
              const chunk = options.chunk
              const outputOptions = options.outputOptions
              if (chunk.filenameTemplate) {
                filenameTemplate = chunk.filenameTemplate
              } else if (chunk.hasEntryModule()) {
                filenameTemplate = outputOptions.filename
              } else {
                if (me.dev) {
                  let topLevelModuleName = tryGetChunkEntryFileName(chunk)
                  if (chunk.name === null && topLevelModuleName) {
                    options.chunk.name = topLevelModuleName
                  }
                  filenameTemplate = outputOptions.chunkFilename
                }
              }

              options.chunk.filenameTemplate = filenameTemplate
              return originalMethod(result, options)
            }
          }
          return tapInfo
        }
      })
    })
  }
}

function tryGetChunkEntryFileName (chunk) {
  const modules = chunk.getModules()
  // 找到入口module，depth越大，表示引入的深度越深。
  let topLevel = modules.reduce((rst, module) => {
    if (module.depth < rst) {
      return module.depth
    }
    return rst
  }, Number.MAX_VALUE)

  let topLevelModules = modules.reduce((rst, module) => {
    if (module.depth === topLevel) {
      if (module.rootModule) {
        module = module.rootModule
      }
      if (!module.id || module.id.includes('node_modules')) {
        return rst
      }

      let name = module.id
      name = name.replace(/^[./]*/, '')
      name = name.replace(/[/.]/g, '_')
      rst.push(name)
    }
    return rst
  }, [])

  return topLevelModules.join('-')
}
