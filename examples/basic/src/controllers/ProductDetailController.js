import React, { Component } from 'react'
import controller, {requireModel } from '@symph/joy/controller'
import ProductsModel from '../models/ProductsModel'
import styles from './ProductDetailController.less'

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
  }

  async componentPrepare () {
    let {dispatch, productId} = this.props

    await dispatch({
      type: 'products/getProduct',
      productId
    })

  }

  render () {
    let {product} = this.props
    return (
      <div className={styles.root}>
        <h1>Product Detail</h1>
        {
          !product
            ? <div className={styles.loading}>loading...</div>
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
