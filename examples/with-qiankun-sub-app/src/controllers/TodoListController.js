import React, { Component } from 'react'
import controller from '@symph/joy/controller'
import { autowire } from '@symph/joy/autowire'
import asset from '@symph/joy/asset'
import { routerRedux } from '@symph/joy/router'
import { Link } from '@symph/joy/router'
import TodosModel from '../models/TodosModel'
import styles from './TodoListController.less'
import getConfig from '@symph/joy/config'

const {publicRuntimeConfig:{routePrefix}} = getConfig()

@controller((state, ownProps, store) => {                // state is store's state
  return {
    todos: state.todos.entities,  // bind model's state to props
    pageIndex: state.todos.pageIndex,
    count: state.todos.count
  }
})
export default class TodoListController extends Component {

  @autowire()
  todosModel: TodosModel

  async componentPrepare () {
    let {todos} = this.props
    // fetch the first page data
    if (todos.length === 0) {
      await this.todosModel.getTodos({lastId: 0, pageSize: 5})
    }
  }

  nextPage = async () => {
    let {todos} = this.props
    if (todos.length === 0) {
      return
    }
    await this.todosModel.getTodos({lastId: todos[todos.length - 1].id, pageSize: 5})
  }

  addTodo = async () => {
    let newTodo = {
      content: `new todo item`,
      hasFinished: false
    }
    await this.todosModel.addTodo(newTodo)
  }

  onChangeHasFinished = async (todo, event) => {
    this.todosModel.setHasFinished(todo.id, event.target.checked)
  }

  onClickOpenByJs = async () => {
    let {dispatch, todos} = this.props
    if (todos.lenght == 0) {
      return
    }
    dispatch(routerRedux.push(`${routePrefix}/${todos[0].id}`))
  }

  render () {
    let {todos = [], pageIndex, count} = this.props
    return (
      <div className={styles.root}>
        <img className={styles.logo} src={asset('/test.jpg')}/>
        <h3>Todo List Total :{count}</h3>
        <div className={styles.actions}>
          <button className={styles.action} onClick={this.addTodo}>Add New</button>
          <button className={styles.action} onClick={this.onClickOpenByJs}>Open LastTodo</button>
        </div>
        <div>
          {todos.map((todo, i) => {
            return (
              <div className={styles.todo} key={todo.id}>
                <input type="checkbox" checked={todo.hasFinished} onChange={this.onChangeHasFinished.bind(this, todo)}/>
                <Link to={`${routePrefix}/${todo.id}`}>{todo.id}. {todo.content}</Link>
              </div>)
          })}
        </div>
        {count > todos.length
          ? <div className={styles.btnNextPage} onClick={this.nextPage}>next page &raquo;</div>
          : null
        }
      </div>
    )
  }
}
