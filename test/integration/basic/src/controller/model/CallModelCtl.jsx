import React from 'react'
import { controller, autowire } from '@symph/joy/controller'
import CallModel from '../../model/CallModel'

@controller((store, ownProps) => {
  return {
    count: store.callModel.count
  }
})
export default class CallModelCtl extends React.Component {

  state = {
    stateCount: this.props.count
  }

  @autowire()
  callModel: CallModel

  onClickAdd = async () => {
    let newCount = await this.callModel.add(1)
    this.setState({
      stateCount: newCount
    })
  }

  render () {
    return (<div>
      <div>{`count:${this.props.count}`}</div>
      <div>{`stateCount:${this.state.stateCount}`}</div>
      <button id={'addCount'} onClick={this.onClickAdd}>add count 1</button>
    </div>)
  }
}
