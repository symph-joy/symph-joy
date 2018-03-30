import React, {Component, PureComponent} from 'react'
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

      static contextTypes = {
        dva: PropTypes.object,
        store: PropTypes.object,
        isComponentDidPrepare: PropTypes.bool,
      }

      constructor(props, context) {
        super(props, context);
      }

      getComponent() {
        return <Comp key='Component' {...this.props} />
      }

      componentWillMount() {
        const {dva, isComponentDidPrepare} = this.context;
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
          dva.prepareManager.prepareComponent(this.component);

          // const componentPrepare = this.component.type.prototype.componentPrepare;
          // if (componentPrepare) {
          //   componentPrepare.call(this.component)
          // }
        }
      }

      render() {
        return this.getComponent()
      }
    }

    return connect(mapStateToProps, dispatch => ({dispatch}))(ControllerComponent);
  }

}

/***
 * 注册model， 必须在@Controller的下面注册model，这样在@Controller中才能正常识别注册的model <br\>
 * 只需要在入口Controller中注册依赖的model即可，如果多次注册，只有第一次注册有效。
 * @param models array
 * @returns {function(*)}
 */
export function requireModel(...models) {

  return Comp => {

    if (!models || models.length === 0) {
      return Comp;
    }

    return class RequireModel extends PureComponent {
      static contextTypes = {
        dva: PropTypes.object,
        isComponentDidPrepare: PropTypes.bool,
      }

      constructor(props, context){
        super(props, context)

        models.forEach((model) =>{
          context.dva.model(model)
        })
      }

      render() {
        return <Comp {...this.props}/>
      }
    }

  }

  // return Comp => {
  //
  //   if (process.env.NODE_ENV !== 'production') {
  //     if (Comp.__meta && Comp.__meta.type === 'Controller') {
  //       console.error('you must require model, below @Controllor decorator');
  //     }
  //   }
  //
  //   models = models || [];
  //   const existModels = Comp.__meta && Comp.__meta.models || [];
  //
  //   Comp.__meta = {
  //     ...Comp.__meta,
  //     models: [...models, ...existModels]
  //   };
  //
  //   return Comp;
  // }
}
