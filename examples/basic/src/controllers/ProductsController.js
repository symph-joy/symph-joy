import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './ProductsController.less'
import {controller , requireModel} from '@symph/joy/controller'
import { routerRedux } from '@symph/joy/router'
import { Link } from '@symph/joy/router'
import ImageView from '../components/image-view'
import ProductsModel from '../models/ProductsModel'


@requireModel(ProductsModel)            // register model
@controller((state, ownProps, store) => {                // state is store's state
  return {
    products:  state.products.products,  // bind model's state to props
    pageIndex:  state.products.pageIndex
  }
})
export default class ProductsController extends Component {
  async componentPrepare () {
    let {products} = this.props

    // fetch the first page data, when products is empty
    if (products.length === 0) {
      await this.getProducts(1, 5)
    }
  }

  getProducts = async (pageIndex, pageSize) => {
    let {dispatch} = this.props
    // call model's method
    await dispatch({
      type: 'products/getProducts',
      pageIndex,
      pageSize,
    })
  }

  addProduct = () => {
    this.props.dispatch({
      type: 'products/addProduct',
      product: {
        id: new Date().getTime(),
        name: 'iphone x',
        price: 8999,
      }
    })
  }

  onClickOpenByJs = () => {
    const {dispatch} = this.props
    dispatch(routerRedux.push(`/products/0`))
  }

  render () {
    let {products = [], pageIndex} = this.props
    return (
      <div className={styles.root}>
        <ImageView className={styles.logo}/>
        <h3>Product List</h3>
        <div className={styles.actions}>
          <button className={styles.action} onClick={this.addProduct}>Add New Product</button>
          <button className={styles.action} onClick={this.onClickOpenByJs}>Open Detail</button>
        </div>
        <div>
          {products.map((product, i) => {
            return <div className={styles.product} key={product.id}><Link to={`/products/${product.id}`}>id:{product.id},
              name:{product.name}, price: {product.price}￥</Link></div>
          })}
        </div>
        <div className={styles.btnNextPage} onClick={this.getProducts.bind(this, pageIndex + 1, 5)}>next
          page &raquo;</div>
      </div>
    )
  }
}
