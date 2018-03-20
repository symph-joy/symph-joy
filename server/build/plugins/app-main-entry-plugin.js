/**
 * 处理应用入口组件的地方，主要是在入口的地方
 * 应用入口在config.mian 配置入口文件路径
 *
 */
import {ConcatSource} from 'webpack-sources'


class AppMainEntryTemplatePlugin {

  constructor(appEntryFilePath){
    this.appEntryFilePath = appEntryFilePath;
  }

  apply(chunkTemplate) {
    chunkTemplate.plugin('render',  (moduleSource, module) => {


      if (!module.resource || module.resource !== this.appEntryFilePath) {
        return moduleSource
      }
      console.log(`> App main entry file is ${module.resource}`)
      const source = new ConcatSource()
      source.add(`
        var AppMain = `)
      source.add(moduleSource)
      source.add(`
        window.__SYMPHONY_APP_MAIN = AppMain.default;`)
      return source
    })
  }
}

export default class AppMainEntryPlugin {
  constructor({appEntryFilePath}) {

    if (appEntryFilePath === undefined || appEntryFilePath === null || appEntryFilePath.length === 0) {
      throw 'has not config app entry component';
    }
    this.appEntryFilePath = appEntryFilePath;
  }

  apply(compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.moduleTemplate.apply(new AppMainEntryTemplatePlugin(this.appEntryFilePath))
    })
  }
}
