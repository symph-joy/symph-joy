import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './ProductsController.less'
import controller, { requireModel } from '@symph/joy/controller'
import { Link } from '@symph/joy/router'
import ImageView from '../components/image-view'
import ProductsModel from '../models/ProductsModel'

@requireModel(ProductsModel)            // register model
@controller((state) => {                // state is store's state
  return {
    products: state.products.products,  // bind model's state to props
    pageIndex: state.products.pageIndex
  }
})
export default class ProductsController extends Component {
  static contextProps = {
    isComponentDidPrepare: PropTypes.bool,
  }

  constructor (props, context) {
    super(...arguments)
  }

  async componentPrepare () {
    let dispatch = this.props.dispatch
    await this.getProducts(1, 5)
  }

  getProducts = async (pageIndex, pageSize) => {
    let {dispatch} = this.props
    // call model's effect method
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

  render () {
    let {products = [], pageIndex} = this.props
    return (
      <div className={styles.root}>
        <ImageView className={styles.logo}/>
        <div>Product List</div>
        <button onClick={this.addProduct}>add new product</button>
        <div>
          {products.map((product, i) => {
            return <div className={styles.product} key={product.id} ><Link to={`/products/${product.id}`}>id:{product.id}, name:{product.name}, price: {product.price}￥</Link></div>
          })}
        </div>
        <button onClick={this.getProducts.bind(this, pageIndex + 1, 5)}>next page</button>
      </div>
    )
  }
}



