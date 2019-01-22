import React from 'react'
import { controller, autowire } from '@symph/joy/controller'
import HelloModel from '../../model/HelloModel'

@controller((store, ownProps) => {
  return {
    hello: store.hello.message
  }
})
export default class AutowireCtl extends React.Component {

  @autowire({type:HelloModel})
  helloModel: HelloModel

  render () {
    return (<div>{`message:${this.props.hello}`}</div>)
  }
}
