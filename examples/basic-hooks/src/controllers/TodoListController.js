import React, { useCallback, useEffect } from 'react'
import { useDispatch, useMappedState, useModel } from '@symph/joy/hook'
import asset from '@symph/joy/asset'
import { Link, routerRedux } from '@symph/joy/router'
import TodosModel from '../models/TodosModel'
import styles from './TodoListController.less'

export default function TodoListController (props) {

  const [todosModel] = useModel([TodosModel])
  const dispatch = useDispatch()

  // Declare your memoized mapState function
  const mapState = useCallback(
    (state) => {                // state is store's state
      return {
        todos: state.todos.entities,  // bind model's state to props
        pageIndex: state.todos.pageIndex,
        pageSize: state.todos.pageSize,
        count: state.todos.count
      }
    },
    [],
  )
  // Get data from and subscribe to the store
  let {todos = [], pageIndex, pageSize, count} = useMappedState(mapState)

  const loadData = ()=>{
    todosModel.getTodos({pageIndex: 1, pageSize: 5})
  }

  useEffect(() => {
    if(!todos || !todos.length){
      loadData()
    }
  }, [])

  const onClickAddTodo = async () => {
    let newTodo = {
      content: `new todo item`,
      hasFinished: false
    }
    await todosModel.addTodo(newTodo)
  }

  const onClickOpenByJs = async () => {
    if (todos.lenght === 0) {
      return
    }
    dispatch(routerRedux.push(`/todos/${todos[0].id}`))
  }

  const onChangeHasFinished = async (todo, event) => {
    todosModel.setHasFinished(todo.id, event.target.checked)
  }

  return (
    <div className={styles.root}>
      <img className={styles.logo} src={asset('/test.jpg')}/>
      <h3>Todo List Total :{count}</h3>
      <div className={styles.actions}>
        <button className={styles.action} onClick={loadData}>Refresh</button>
        <button className={styles.action} onClick={onClickAddTodo}>Add New</button>
        <button className={styles.action} onClick={onClickOpenByJs}>Open LastTodo</button>
      </div>
      <div>
        {todos.map((todo, i) => {
          return (
            <div className={styles.todo} key={todo.id}>
              <input type="checkbox" checked={todo.hasFinished} onChange={onChangeHasFinished.bind(null, todo)}/>
              <Link to={`/todos/${todo.id}`}>{todo.id}. {todo.content}</Link>
            </div>)
        })}
      </div>
      {count > todos.length
        ? <div className={styles.btnNextPage} onClick={()=>todosModel.getTodos({pageIndex: pageIndex+1, pageSize})}>next page &raquo;</div>
        : null
      }
    </div>
  )
}
