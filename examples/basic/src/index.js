import React, {Component} from 'react'
import {Switch, Route} from 'symphony-joy/router'
import dynamic from 'symphony-joy/dynamic'

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
