import React, { useCallback, useEffect } from 'react'
import { useMappedState, useModel } from '@symph/tempo/hook'
import TodosModel from '../models/TodosModel'
import styles from './TodoDetailController.less'

export default function TodoDetailController ({match}) {
  const todoId = Number(match.params.id)
  const [todosModel] = useModel([TodosModel])

  // Declare your memoized mapState function
  const mapState = useCallback(
    (state) => {                // state is store's state
      return {
        todo: state.todos.details[todoId]
      }
    },
    [todoId],
  )
  // Get data from and subscribe to the store
  let {todo} = useMappedState(mapState)

  useEffect(() => {
    todosModel.getTodo(todoId)
  }, [todoId])

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
