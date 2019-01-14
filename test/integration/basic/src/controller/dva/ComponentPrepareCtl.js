import React from 'react'
import {controller, requireModel} from '@symph/joy/controller'
import DvaModel from '../../model/DvaModel'

@requireModel(DvaModel)
@controller((state)=>{
  const {dva} = state;
  return {
    prepare: dva.prepare
  }
})
export default class ModelCtl extends React.Component {
  async componentPrepare(){
    await this.props.dispatch({
      type: 'dva/prepare'
    })
  }
  render () {
    let {prepare} = this.props;
    return (
      <div>
        <div>{`prepare:${prepare}`}</div>
      </div>
    )
  }
}
