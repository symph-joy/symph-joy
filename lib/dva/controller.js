import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

/**
 * 将react 组件封装为controller，提供componentPrepare方法支持，确保该方法在服务端和客户端只执行一次。
 * @param mapStateToProps
 * @returns {function(*)}
 */
function controller (mapStateToProps) {
  return Comp => {
    Comp.contextTypes = {
      dva: PropTypes.object,
      store: PropTypes.object,
      isComponentDidPrepare: PropTypes.bool,
      ...Comp.contextTypes
    }

    // call componentPrepare function if need
    const _componentWillMount = Comp.prototype.componentWillMount
    Comp.prototype.componentWillMount = function () {
      if (_componentWillMount) {
        _componentWillMount.apply(this, arguments)
      }

      const {dva} = this.context
      const {__componentHasPrepared} = this.props
      let isNeedCallPrepare = false
      if (typeof window === 'undefined') {
        if (!__componentHasPrepared) {
          isNeedCallPrepare = true
        }
      } else {
        if (!__componentHasPrepared) {
          isNeedCallPrepare = true
        }
      }
      if (isNeedCallPrepare) {
        dva.prepareManager.prepareComponent(this)
      }
    }

    // inject joy props
    const wrapMapStateToProps = (store, ownProps) => {
      let isPrepared = store['@@joy'].isPrepared
      const joyProps = {__componentHasPrepared: isPrepared}

      if (typeof mapStateToProps === 'function') {
        let props = mapStateToProps(store, ownProps)
        return {
          ...props,
          ...joyProps
        }
      } else {
        return joyProps
      }
    }

    const withConnectedComp = connect(wrapMapStateToProps, dispatch => ({dispatch}))(Comp)

    const withRouterComp = withRouter(withConnectedComp)

    return withRouterComp
  }
}

/***
 * 注册model， 必须在@Controller的下面注册model，这样在@Controller中才能正常识别注册的model <br\>
 * 只需要在入口Controller中注册依赖的model即可，如果多次注册，只有第一次注册有效。
 * @param models array
 * @returns {function(*)}
 */
function requireModel (...models) {
  return Comp => {
    if (!models || models.length === 0) {
      return Comp
    }

    return withRouter(class RequireModel extends PureComponent {
      static contextTypes = {
        dva: PropTypes.object,
        isComponentDidPrepare: PropTypes.bool,
        ...Comp.contextTypes
      }

      constructor (props, context) {
        super(props, context)

        models.forEach((model) => {
          context.dva.model(model)
        })
      }

      render () {
        return <Comp {...this.props} />
      }
    })
  }
}

export default controller
export { controller, requireModel, connect }
