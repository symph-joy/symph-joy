import React from 'react'
import { controller } from '@symph/joy/controller'
import { autowire } from '@symph/joy/autowire'
import HelloModel from '../../model/HelloModel'

@controller((store, ownProps) => {
  return {
    hello: store.hello.message
  }
})
export default class PrepareCtl extends React.Component {

  @autowire()
  helloModel: HelloModel

  async componentPrepare () {
    await this.helloModel.sayHello('hello from componentPrepare')
  }

  render () {
    return (<div>{`message:${this.props.hello}`}</div>)
  }
}
