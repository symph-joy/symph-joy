import React from 'react'
import { controller, requireModel } from '../../../../../../controller'

@controller((store, ownProps) => {
  return {
    mapStateToPropsState: 1,
  }
})
export default class ControllerController extends React.Component {

  state = {
   initState: 0
  }

  async componentPrepare () {
    //in development environment, call setState will occur an error
    this.setState({
      initState: 1
    })
  }

  render () {
    return (<div></div>)
  }
}
