import React, { Component } from 'react'
import { Switch, Route, Redirect } from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'
import NotFound from './components/NotFound'
// import TodoListController from './controllers/Hello'
import TodoListController from './controllers/TodoListController.js'

const TodoDetailController = dynamic({loader: () => import('./controllers/TodoDetailController.js')})

export default class Main extends Component {
  render () {
    return (
      <div>
        <h1>Example Basic - Header</h1>
        <Switch>
          <Route exact path="/" component={TodoListController}/>
          <Route exact path="/todos/:id" component={TodoDetailController}/>
          <Route component={NotFound}/>
        </Switch>
      </div>
    )
  }
}
