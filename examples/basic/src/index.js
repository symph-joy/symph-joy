import React, {Component} from 'react'
import {Switch, Route} from 'symphony-joy/router'

class ClientRootComponent extends Component {

  render() {
    return (
      <Switch>
        <Route exact path="/" component={require('./controllers/IndexController').default}/>
      </Switch>
    );
  }
}

export default ClientRootComponent;
