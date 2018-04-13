import { NAMESPACE_SEP } from './constants'

export const ACTION_START_ASYNC_BATCH = '@@startAsyncBatch'
export const ACTION_END_ASYNC_BATCH = '@@endAsyncBatch'

export default function createPromiseMiddleware (app) {
  const map = {}

  // ==== 自定义部分，用于处理服务端异步业务数据获取 ===
  let isInBatch = true // 在服务端运行是，默认开启
  let effectsInBatch = [] // 一批次执行的任务，在服务端欲获取数据时，一个页面上触发的所有effects放入该队列，用于检测所有异步流程是否全部结束
  let isRejectActions = false
  // ===end===

  const middleware = () => next => (action) => {
    const { type } = action
    if (type === ACTION_START_ASYNC_BATCH) {
      isInBatch = true
      effectsInBatch = []
      return true
    } else if (type === ACTION_END_ASYNC_BATCH) {
      isInBatch = false
      return Promise.all(effectsInBatch).then(() => {
        isRejectActions = true
      })
    } else {
      if (isRejectActions) {
        console.warn(`the action(${action.type}) will be rejected`)
        return Promise.resolve('reject')
      }
      if (isEffect(type)) {
        let task = new Promise((resolve, reject) => {
          map[type] = {
            resolve: wrapped.bind(null, type, resolve),
            reject: wrapped.bind(null, type, reject)
          }
        })
        if (isInBatch) {
          effectsInBatch.push(task)
        }
        return task
      } else {
        return next(action)
      }
    }
  }

  function isEffect (type) {
    const [namespace] = type.split(NAMESPACE_SEP)
    const model = app._models.filter(m => m.namespace === namespace)[0]
    if (model) {
      if (model.effects && model.effects[type]) {
        return true
      }
    }

    return false
  }

  function wrapped (type, fn, args) {
    if (map[type]) delete map[type]
    fn(args)
  }

  function resolve (type, args) {
    if (map[type]) {
      map[type].resolve(args)
    }
  }

  function reject (type, args) {
    if (map[type]) {
      map[type].reject(args)
    }
  }

  return {
    middleware,
    resolve,
    reject
  }
}
