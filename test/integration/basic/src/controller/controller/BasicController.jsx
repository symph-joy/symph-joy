import React from 'react'
import { controller, requireModel } from '@symph/joy/controller'
import PropTypes from 'prop-types'

@controller((store, ownProps) => {
  return {
    mapStateToPropsState: 'from mapStateToPropsState',
  }
})
export default class BasicController extends React.Component {

  static contextTypes = {
    headManager: PropTypes.object,
    tempo: PropTypes.object
  }

  state = {
    state: 'from state of component'
  }

  componentDidMount () {
    this.setState({
      state: 'changed by componentDidMount'
    })
  }

  onClickEditState = () => {
    this.setState({
      state: 'changed by onClickEditState'
    })
  }

  render () {
    let {mapStateToPropsState, location, dispatch} = this.props
    let {tempo, headManager} = this.context
    let {state} = this.state
    return (<div>
      <div id={'state'}>{state}</div>
      <div id={'mapStateToPropsState'}>{mapStateToPropsState}</div>
      <div id={'location_pathname'}>{location.pathname}</div>
      <div id={'dispatch'}>{typeof dispatch}</div>

      <div id={'tempo'}>
        {'tempo:' + JSON.stringify(!!(tempo && tempo.dispatch && tempo.models))}
      </div>
      <div id={'headManager'}>
        {'headManager:' + JSON.stringify(!!(headManager && headManager.updateTitle && headManager.updateHead))}
      </div>

      <button id={'btnChangeState'} onClick={this.onClickEditState}>btnChangeState</button>
    </div>)
  }
}
