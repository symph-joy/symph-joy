import React, { Component } from 'react'
import { controller } from '@symph/joy/controller'
import { autowire } from '@symph/joy/autowire'
import TodosModel from '../models/TodosModel'
import styles from './TodoDetailController.less'

@controller((state, ownProps) => {
  const todoId = Number(ownProps.match.params.id)
  return {
    todoId,
    todo: state.todos.details[todoId]
  }
})
export default class TodoDetailController extends Component {

  @autowire()
  todoModel: TodosModel

  async componentPrepare () {
    let {todoId} = this.props
    await this.todoModel.getTodo(todoId)
  }

  render () {
    let {todo} = this.props
    return (
      <div className={styles.root}>
        <h1>Todo Detail</h1>
        {
          !todo
            ? <div className={styles.loading}>data loading...</div>
            : <div>
              <div>ID: {todo.id}</div>
              <div>content: {todo.content}</div>
              <div>hasFinished: {JSON.stringify(todo.hasFinished)}</div>
            </div>
        }
      </div>
    )
  }
}
