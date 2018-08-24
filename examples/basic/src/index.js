import React, {Component} from 'react'
import {Switch, Route} from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'

const ProductDetailController  = dynamic(import('./controllers/ProductDetailController'));
const ProductsController  = dynamic(import('./controllers/ProductsController'));

export default class Main extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/products/:id" component={ProductDetailController}/>
        <Route exact path="/" component={ProductsController}/>
      </Switch>
    )
  }
}
