import React, {Component} from 'react'
import {Switch, Route} from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'

const IndexController  = dynamic(import('./controllers/IndexController'));

export default class Main extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={IndexController}/>
      </Switch>
    )
  }
}
