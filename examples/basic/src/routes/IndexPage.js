import React, {Component} from 'react';
// import {connect} from 'dva';
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import styles from './IndexPage.less';
// import {startBatch, endBatch} from 'dva-core/lib/createPromiseMiddleware'
import {controller} from 'symphony/dist/lib/dva'
import ImageView from '../components/image-view'


@controller((state) => ({
  me: state.user.me,
  products: state.product.products
}))
export default class IndexPage extends Component {
  static contextTypes = {
    dva: PropTypes.object,
    // store: PropTypes.object,
    isInitialRender: PropTypes.bool,
  }

  static async getInitialProps(dva) {
    const dispatch = dva._store.dispatch
    // startBatch();


    // return endBatch().then((data) => {
    //   console.log('>>>>>>  getInitialPropsFinish:' + JSON.stringify(data));
    //   return '++++++++++++++++++++++'
    // })
  }

  constructor() {
    console.log('>>>>===== IndexPage constructor');
    super(...arguments);
  }

  componentPrepare() {
    let dispatch = this.props.dispatch;
    console.log('>>>>===== prepare');
    console.log('>>>>>> IndexPage start dispatch action ');
    dispatch({
      type: 'user/fetchMe'
    }).then((result) => {
      console.log('>>>>>>  effectResult:' + result);
      return result;
    });
    dispatch({
      type: 'product/fetchProducts'
    });
  }


  componentWillMount() {
    console.log('>>>>>> IndexPage componentWillMount');
    // IndexPage.getInitialProps(this.context.dva);
    // let effectResult = this.props.dispatch({
    //   type: 'user/fetchMe'
    // }).then((result) => {
    //   console.log('>>>>>>  effectResult:' + result);
    // });
    //
    //
    // this.props.dispatch({
    //   type: 'product/fetchProducts'
    // })
  }

  componentDidMount() {
    console.log('>>>>>> componentDidMount');
    this.props.dispatch({
      type: 'product/fetchHots'
    })
  }

  addProduct = () => {
    console.log('>>>>>> start addProduct');
    let reducerResult = this.props.dispatch({
      type: 'product/addProduct',
      product: {
        id: 2,
        name: 'iphone 8 plus',
        price: 6999,
      }
    });
    console.log('>>>>>> end addProduct:' + reducerResult);
    console.dir(reducerResult);
    console.log('>>>>>> new state, products.length:' + this.props.products.length);
  };

  render() {
    let {products = []} = this.props;
    console.dir(this.props);
    return (
      <div className={styles.root}>
        <style jsx>{`
      .user-name {
        font-weight: bold;
      }
    `}</style>
        <ImageView/>
        <div className={'user-name'}>用户名：{this.props.me ? this.props.me.name : '未登录'}</div>
        <div>产品列表</div>
        <button onClick={this.addProduct}>添加产品</button>
        <div>
          {products.map((p, i) => {
            return <div key={i}>{p.name}</div>
          })}
        </div>
      </div>
    );
  }
}


// export default controller((state) => ({
//   me: state.user.me,
//   products: state.product.products
// }))(IndexPage)

// export default Connected;



