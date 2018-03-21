import React, {Component} from 'react'
import userModel from './models/userModel'
import productsModel from './models/productsModel'
import {Switch, Route} from 'symphony-joy/router'
import dynamic from 'symphony-joy/dynamic'
import PropTypes from "prop-types"


class ClientRootComponent extends Component {
  static contextTypes = {
    dva: PropTypes.object,
  }

  constructor(props, context) {
    super();
    console.log('>>>>>> ClientRootComponent constructor');
    const {dva} = context;
    dva.model(userModel);
    dva.model(productsModel);

  }

  render() {
    const {dva} = this.context;
    return (
      <Switch>
        <Route exact path="/" component={require('./routes/IndexPage').default}/>
      </Switch>
    );
  }
}

export default ClientRootComponent;
