import React from 'react'
import { controller, autowire } from '@symph/joy/controller'
import HelloModel from '../../model/HelloModel'

@controller((store, ownProps) => {
  return {
    hello: store.hello.message
  }
})
export default class PrepareCtl extends React.Component {

  @autowire()
  helloModel: HelloModel

  async componentPrepare() {
    await this.helloModel.sayHello('hello from componentPrepare')
  }

  render () {
    return (<div>{`message:${this.props.hello}`}</div>)
  }
}
