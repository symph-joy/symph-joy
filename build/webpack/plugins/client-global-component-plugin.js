/**
 * 处理应用入口组件的地方，主要是在入口的地方
 * 应用入口在config.mian 配置入口文件路径
 *
 */
import { ConcatSource } from 'webpack-sources'

export default class ClientGlobalComponentPlugin {
  constructor ({ sourceFilePath, globalName }) {
    if (sourceFilePath === undefined || sourceFilePath === null || sourceFilePath.length === 0) {
      throw new Error('ClientGlobalComponentPlugin init error,  sourceFilePath is empty')
    }
    this.sourceFilePath = sourceFilePath
    this.globalName = globalName
    console.log(`> ${this.globalName} source path is ${this.sourceFilePath}`)
  }

  apply (compiler) {
    compiler.hooks.compilation.tap('AppMainEntryPlugin', (compilation) => {
      compilation.moduleTemplate.hooks.render.tap('AppMainEntryPluginRegister', (moduleSource, module) => {
        if (!module.resource && module.rootModule) {
          module = module.rootModule
        }

        if (!module.resource || module.resource !== this.sourceFilePath) {
          return moduleSource
        }
        const source = new ConcatSource()
        source.add(moduleSource)
        source.add(`
        ;
        (function(Comp){
          window.${this.globalName} = Comp;
          if (module.hot){
              module.hot.accept()
          }
        })(module.exports || __webpack_exports__ )
        ;
        `)
        return source
      })
    })
  }
}
