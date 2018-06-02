import React, {Component} from 'react'
import {Switch, Route} from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'

class ClientRootComponent extends Component {

  render() {
    return (
      <Switch>
        {/*<Route exact path="/" component={require('./controllers/IndexController').default}/>*/}
        <Route exact path="/" component={dynamic(import('./controllers/IndexController'))}/>
      </Switch>
    );
  }
}

export default ClientRootComponent;
