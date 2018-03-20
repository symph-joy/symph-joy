import React, {Component} from 'react'
// import { routerRedux, Route, Switch } from 'dva/router';
// import IndexPage from './routes/IndexPage'
import userModel from './models/userModel'
import productsModel from './models/productsModel'
import {StaticRouter,BrowserRouter, Switch, Route} from 'react-router-dom'
import dynamic from 'symphony/dynamic'
import PropTypes from "prop-types"


// const dva = DvaCore.create({});
//
// dva.model(userModel);
// dva.model(productsModel);
//
// dva.start();
const RouterComp = (typeof window === 'undefined') ? StaticRouter : BrowserRouter;

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
            <Route exact path="/idx" component={require('./routes/IndexPage').default}/>
          </Switch>
        );
  }
}

export default ClientRootComponent;
