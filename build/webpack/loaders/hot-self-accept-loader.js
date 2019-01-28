// @flow
import loaderUtils from 'loader-utils'

type Options = {|
  extensions: RegExp,
  include: Array<string>
|}

module.exports = function (content: string, sourceMap: any) {
  this.cacheable()

  const options: Options = loaderUtils.getOptions(this)
  if (!options.extensions) {
    throw new Error('extensions is not provided to hot-self-accept-loader. Please upgrade all joy-plugins to the latest version.')
  }

  if (!options.include) {
    throw new Error('include option is not provided to hot-self-accept-loader. Please upgrade all joy-plugins to the latest version.')
  }

  // Webpack has a built in system to prevent default from colliding, giving it a random letter per export.
  // We can safely check if Component is undefined since all other pages imported into the entrypoint don't have __webpack_exports__.default
  this.callback(null, `${content}
    (function (Component) {
      if(!Component) return
      if (!module.hot) return
      module.hot.accept()
    })(typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__.default : (module.exports.default || module.exports))
  `, sourceMap)
}
