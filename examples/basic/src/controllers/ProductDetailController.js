import React, { Component } from 'react'
import controller, { requireModel } from '@symph/joy/controller'
import ProductsModel from '../models/ProductsModel'

@requireModel(ProductsModel)
@controller((state, ownProps) => {
  const productId = ownProps.match.params.id
  return {
    productId,
    product: state.products.details[productId]
  }
})
export default class ProductDetailController extends Component {

  constructor () {
    super(...arguments)
    this.state = {
      isLoading: false
    }
  }

  async componentPrepare () {
    let {dispatch, productId} = this.props

    this.setState({
      isLoading: true
    })

    await dispatch({
      type: 'products/getProduct',
      productId
    })

    this.setState({
      isLoading: false
    })
  }

  render () {
    let {product} = this.props
    let {isLoading} = this.state
    return (
      <div>
        <h1>Product Detail</h1>
        {
          isLoading
            ? <div>loading...</div>
            : <div>
              <div>ID: {product.id}</div>
              <div>Name: {product.name}</div>
              <div>Price: {product.price}</div>
            </div>
        }
      </div>
    )
  }
}
