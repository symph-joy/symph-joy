import warning from 'warning'
import { isArray } from './utils'
import { NAMESPACE_SEP } from './constants'

function prefix (obj, namespace, type) {
  return Object.keys(obj).reduce((memo, key) => {
    warning(
      key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
      `[prefixNamespace]: ${type} ${key} should not be prefixed with namespace ${namespace}`
    )
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`
    memo[newKey] = obj[key]
    return memo
  }, {})
}

export default function prefixNamespace (model) {
  // 此函数会修改原有model的结构，所以不能多次调用。lane 2017-12-19
  if (model.__HAS_DVA_PREFIXED) {
    return model
  }
  model.__HAS_DVA_PREFIXED = true
  const {
    namespace,
    reducers,
    effects
  } = model

  if (reducers) {
    if (isArray(reducers)) {
      model.reducers[0] = prefix(reducers[0], namespace, 'reducer')
    } else {
      model.reducers = prefix(reducers, namespace, 'reducer')
    }
  }
  if (effects) {
    model.effects = prefix(effects, namespace, 'effect')
  }
  return model
}
