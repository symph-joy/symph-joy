import React, {Component} from 'react'
import styles from './IndexController.less'
import controller, {requireModel} from 'symphony-joy/controller'
import ImageView from '../components/image-view'
import ProductsModel from '../models/ProductsModel'

@requireModel(ProductsModel)
@controller((state) => {
  console.log('>>>>>> IndexController connect')
  return {
    products: state.products.products,
    pageIndex: state.products.pageIndex
  }
})
export default class IndexController extends Component {
  constructor() {
    console.log('>>>>>> IndexController constructor');
    super(...arguments);
  }

  componentWillMount() {
    console.log('>>>>>> IndexController componentWillMount');
  }

  async componentPrepare() {
    let dispatch = this.props.dispatch;
    console.log('>>>>>> prepare');
    await this.getProducts(1, 5);
  }

  getProducts = async (pageIndex, pageSize) => {
    let {dispatch} = this.props;
    await dispatch({
      type: 'products/getProducts',
      pageIndex,
      pageSize,
    });
  };

  addProduct = () => {
    this.props.dispatch({
      type: 'products/addProduct',
      product: {
        id: new Date().getTime(),
        name: 'iphone 8',
        price: 5999,
      }
    });
  };

  onClickProduct = () => {

  };

  render() {
    let {products = [], pageIndex} = this.props;
    return (
      <div className={styles.root}>
        <style jsx>{`
      .user-name {
        font-weight: bold;
      }
    `}</style>
        <ImageView className={styles.logo}/>
        <div>产品列表</div>
        <button onClick={this.addProduct}>添加产品</button>
        <div>
          {products.map((p, i) => {
            return <div key={p.id} onClick={this.onClickProduct.bind(p)}>{p.id}:{p.name}</div>
          })}
        </div>
        <button onClick={this.getProducts.bind(this, pageIndex + 1, 5)}>获取下一页</button>
      </div>
    );
  }
}



