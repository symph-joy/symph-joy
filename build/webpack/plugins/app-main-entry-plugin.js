/**
 * 处理应用入口组件的地方，主要是在入口的地方
 * 应用入口在config.mian 配置入口文件路径
 *
 */
import { ConcatSource } from 'webpack-sources'

export default class AppMainEntryPlugin {
  constructor ({appEntryFilePath}) {
    if (appEntryFilePath === undefined || appEntryFilePath === null || appEntryFilePath.length === 0) {
      throw new Error('has not config app entry component')
    }
    this.appEntryFilePath = appEntryFilePath
    console.log(`> App Main Component: ${appEntryFilePath}`)
  }

  apply (compiler) {
    compiler.hooks.compilation.tap('AppMainEntryPlugin', (compilation) => {
      compilation.moduleTemplate.hooks.render.tap('AppMainEntryPluginRegister', (moduleSource, module) => {
        if (!module.resource && module.rootModule) {
          module = module.rootModule
        }

        if (!module.resource || module.resource !== this.appEntryFilePath) {
          return moduleSource
        }
        console.log(`> App main entry file is ${module.resource}`)
        const source = new ConcatSource()
        source.add(moduleSource)
        source.add(`
        ;
        (function(Comp){
          window.__JOY_APP_MAIN = Comp;
          if (module.hot){
              module.hot.accept()
          }
        })(__webpack_exports__)
        ;
        `)
        return source
      })
    })
  }
}
