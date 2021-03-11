import React from 'react'
import { controller } from '@symph/joy/controller'
import { autowire } from '@symph/joy/autowire'
import HelloModel from '../../model/HelloModel'

@controller((store, ownProps) => {
  return {
    hello: store.hello.message
  }
})
export default class AutowireCtl extends React.Component {

  @autowire({type: HelloModel})
  helloModel: HelloModel

  render () {
    return (<div>{`message:${this.props.hello}`}</div>)
  }
}
