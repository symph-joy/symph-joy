import React, { Component } from 'react'
import { Switch, Route } from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'

const ProductsController = dynamic({loader: () => import('./controllers/ProductsController')})
const ProductDetailController = dynamic({loader: () => import('./controllers/ProductDetailController')})

export default class Main extends Component {
  render () {
    return (
      <div>
        <h1>Example Basic</h1>
        <Switch>
          <Route exact path="/products/:id" component={ProductDetailController}/>
          <Route exact path="/" component={ProductsController}/>
        </Switch>
      </div>
    )
  }
}
