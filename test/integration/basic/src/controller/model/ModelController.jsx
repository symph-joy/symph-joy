import React from 'react'
import { controller, requireModel } from '../../../../../../controller'
import BasicModel from '../../model/BasicModel'

@requireModel(BasicModel)
@controller((store, ownProps) => {
  return {
    ...store.basic
  }
})
export default class Hello extends React.Component {

  async componentPrepare () {
    let {dispatch} = this.props
    await dispatch({
      type: 'basic/fetchTodos'
    })
  }

  onClickAddTodo = () => {
    let {dispatch} = this.props
    dispatch({
      type: 'basic/addTodo',
      todo: 'todo-add-by-click'
    })
  }

  onClickAutoAddTodo = () => {
    let {dispatch} = this.props
    dispatch({
      type: 'basic/autoAddTodo',
    })
  }

  callModel = (action) => {
    let {dispatch} = this.props
    dispatch(action)
  }

  render () {
    let {hello, hasFetchData, todos, multiEditState, dispatchResult, jsonState, jsonStoreState} = this.props
    return (<div>
      <div>
        <h1>state on show</h1>
        <div>hello:<span id={'hello'}>{hello}</span></div>
        <div>hasFetchData:<span id={'hasFetchData'}>{JSON.stringify(hasFetchData)}</span></div>
        <div>messageCount:<span id={'messagesCount'}>{todos && todos.length || 0}</span></div>
        {(todos || []).map((todo, index) => {
          return (
            <div key={index}>{todo}</div>
          )
        })}
        <div>dispatchResult:<span id={'dispatchResult'}>{dispatchResult}</span></div>
        <button id="btnAddTodo" onClick={this.onClickAddTodo}>callMoth</button>
        <button id="btnAutoAddTodo" onClick={this.onClickAutoAddTodo}>dispatch</button>

        <div>multiEditState:<span id={'multiEditState'}>{multiEditState}</span></div>
        <button id="btnMultiEditState" onClick={this.callModel.bind(this, {type:'basic/multiEditState'})}>multiEditState</button>

        <div>getState:<span id={'jsonState'}>{jsonState}</span></div>
        <button id="btnGetState" onClick={this.callModel.bind(this, {type: 'basic/tryGetState'})}>jsonState</button>

        <div>getState:<span id={'jsonStoreState'}>{jsonStoreState}</span></div>
        <button id="btnGetStoreState" onClick={this.callModel.bind(this, {type: 'basic/tryGetStoreState'})}>jsonStoreState</button>

      </div>
    </div>)
  }
}
