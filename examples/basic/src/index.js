import React, { Component } from 'react'
import { Switch, Route, Redirect } from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'

const ProductsController = dynamic({loader: () => import('./controllers/ProductsController')})
const ProductDetailController = dynamic({loader: () => import('./controllers/ProductDetailController')})

const Status = ({ code, children }) => (
  <Route
    render={({ staticContext }) => {
      if (staticContext) staticContext.status = code;
      return children;
    }}
  />
)

const NotFound = () => (
  <Status code={404}>
    <div>
      <h1>Sorry, can’t find that.</h1>
    </div>
  </Status>
)


export default class Main extends Component {
  render () {
    return (
      <div>
        <h1>Example Basic - Header</h1>
        <Switch>
          <Route exact path="/products/:id" component={ProductDetailController}/>
          <Redirect exact from="/redirect" to={"/"}/>
          <Route exact path="/" component={ProductsController}/>
          <Route component={NotFound}/>
        </Switch>
      </div>
    )
  }
}
