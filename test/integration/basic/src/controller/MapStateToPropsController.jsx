import React from 'react'
import {controller, requireModel} from '../../../../../controller'
import MVCModel from '../model/BasicModel'

@requireModel(MVCModel)
@controller((store, ownProps)=>{
  return {
    constStr: 'const value from mapStateToProps',
  }
})
export default class Hello extends React.Component{
  render(){
    let {constStr} = this.props
    return (<div>
      <div>constStr:<span id={'constStr'}>{constStr}</span></div>
    </div>)
  }
}
