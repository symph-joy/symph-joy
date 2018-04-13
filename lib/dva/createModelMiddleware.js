import {NAMESPACE_SEP} from './constants'

export default function createModelMiddleware (app) {
  const middleware = () => next => (action) => {
    const {type} = action
    console.log('>>>> createModelMiddleware:' + type)
    if (type.indexOf('/') <= 0) {
      return next(action)
    }
    const [namespace, funName] = type.split(NAMESPACE_SEP)
    if (funName.indexOf('__') === 0) {
      return next(action)
    }

    const model = app.models[namespace]
    let fun = model && model[funName]

    if (fun !== undefined && fun !== null) {
      return fun.call(model, action)
    } else {
      return next(action)
    }
  }

  return middleware
}
