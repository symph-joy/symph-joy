import React,{Component} from 'react'
import {connect} from 'react-redux'
import PropTypes from 'prop-types'

/**
 * 将react 组件封装为controller，提供componentPrepare方法支持，确保该方法在服务端和客户端只执行一次。
 * @param mapStateToProps
 * @returns {function(*)}
 */
export default function controller(mapStateToProps) {
  return Comp => {

    class ControllerComponent extends Component {
      constructor() {
        super(...arguments);
      }

      static contextTypes = {
        dva: PropTypes.object,
        store: PropTypes.object,
        isComponentDidPrepare: PropTypes.bool,
      }

      getComponent() {
        return <Comp  {...this.props} />
      }

      componentWillMount() {
        const isComponentDidPrepare = this.context.isComponentDidPrepare;
        let isNeedCallPrepare = false;

        if (typeof window === 'undefined') {
          if (!isComponentDidPrepare) {
            isNeedCallPrepare = true;
          }
        } else {
          if (!isComponentDidPrepare) {
            isNeedCallPrepare = true;
          }
        }

        if (isNeedCallPrepare) {
          this.component = this.getComponent();
          const componentPrepare = this.component.type.prototype.componentPrepare;
          if(componentPrepare){
            componentPrepare.call(this.component)
          }
        }
      }

      render() {
        return this.getComponent()
      }
    }

    return connect(mapStateToProps, dispatch => ({dispatch}))(ControllerComponent);
  }


}
