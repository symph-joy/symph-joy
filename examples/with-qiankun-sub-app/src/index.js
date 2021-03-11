import React, { Component } from 'react'
import { Switch, Route } from '@symph/joy/router'
import getConfig from '@symph/joy/config'
import dynamic from '@symph/joy/dynamic'
import NotFound from './components/NotFound'
import TodoListController from './controllers/TodoListController.js'

const { publicRuntimeConfig: { routePrefix } } = getConfig()
const TodoDetailController = dynamic({ loader: () => import('./controllers/TodoDetailController.js') })

export default class Main extends Component {
  render () {
    return (
      <div style={{ padding: 24}}>
        <div style={{ padding: 24, backgroundColor: '#fff' }}>
          <h2 style={{ borderBottom:'solid 1px #dddddd'}}>todo list</h2>
          <Switch>
            <Route exact path={`${routePrefix}/list`} component={TodoListController}/>
            <Route exact path={`${routePrefix}/:id`} component={TodoDetailController}/>
            <Route path={`${routePrefix}/`} component={NotFound}/>
          </Switch>
        </div>
      </div>
    )
  }
}
