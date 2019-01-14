import React from 'react'
import Head from '@symph/joy/head'
import {controller, requireModel} from '@symph/joy/controller'
import DvaModel from '../../model/DvaModel'

@requireModel(DvaModel)
@controller((state)=>{
  const {dva} = state;
  return {
    msg: dva.msg,
    count: dva.count,
    reducer: dva.reducer
  }
})
export default class ModelCtl extends React.Component {

  callReducer = () => {
    this.props.dispatch({
      type: 'dva/callReducer',
      payload: {
        reducer: 'set by reducer'
      }
    })
  }
  callEffect = () => {
    let {count} = this.props;
    this.props.dispatch({
      type: 'dva/callEffect',
      count: count,
      add: 1
    })
  }
  render () {
    let {msg, reducer, count} = this.props;
    return (
      <div>
        <div>{`msg:${msg}`}</div>

        <div>{`reducer:${reducer}`}</div>
        <button id={'callReducer'} onClick={this.callReducer}>callReducer</button>

        <div>{`count:${count}`}</div>
        <button id={'callEffect'} onClick={this.callEffect}>callEffect</button>
      </div>
    )
  }
}
