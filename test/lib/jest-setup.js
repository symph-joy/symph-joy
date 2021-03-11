const JestRuntime = require('jest-runtime')
const gfs = require('graceful-fs')

module.exports = async function () {
  patchJestRuntimeRequire()
}

function patchJestRuntimeRequire () {
  /**
   * when source file changed, should delete cache
   */
  const moduleStats = new Map()
  const oRequireModule = JestRuntime.prototype.requireModule
  JestRuntime.prototype.requireModule = function (from, moduleName, options, isRequireActual) {
    const modulePath = this._resolveModule(from, moduleName)
    let cacheStat = moduleStats.get(modulePath)
    let fileStat = gfs.existsSync(modulePath) && gfs.statSync(modulePath).mtime.getTime()
    if (!cacheStat) {
      moduleStats.set(modulePath, fileStat)
    } else {
      if (cacheStat !== fileStat) {
        this._moduleRegistry.set(modulePath, undefined)
      }
    }
    return oRequireModule.apply(this, arguments)
  }


  /**
   *  in jest-runtime/build/index.js. always using cached file content, so we can not get new data.
   *  if this issue is fixed, we should replace origin require method, rather than read file directly.
   *
   *  readFile(filename) {
   *     let source = this._cacheFS.get(filename);
   */
  const fileStats = new Map()
  JestRuntime.prototype.readFile = function (filename) {
    let source = this._cacheFS.get(filename)
    let cacheStat = fileStats.get(filename)
    let fileStat = gfs.statSync(filename).mtime.getTime()
    if (!source || cacheStat !== fileStat) {
      source = gfs.readFileSync(filename, 'utf8')
      this._cacheFS.set(filename, source)
      fileStats.set(filename, fileStat)
    }
    return source
  }
}

