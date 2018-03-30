import React, {Component} from 'react'
import userModel from './models/userModel'
import {Switch, Route} from 'symphony-joy/router'
import Controller, {requireModel} from "../../../controller";

@requireModel(userModel)
@Controller()
class ClientRootComponent extends Component {

  constructor(props, context) {
    super();
    console.log('>>>>>> ClientRootComponent constructor');
  }

  render() {
    return (
      <Switch>
        <Route exact path="/" component={require('./routes/IndexPage').default}/>
      </Switch>
    );
  }
}

export default ClientRootComponent;
