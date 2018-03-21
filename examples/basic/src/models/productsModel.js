import fetch from 'symphony-joy/fetch'
// console.log('//////////'+_fetch)
// const fetch = _fetch.fetch

export default {

  namespace: 'product',

  state: {
    products: [{
      id: 0,
      name: 'iphone 6 a',
      price: 5999,
    }],
  },

  subscriptions: {},

  effects: {
    * fetchProducts({payload}, {call, put}) {  // eslint-disable-line
      let products = yield new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(
            [{
              id: 1,
              name: 'iphone 7 plus',
              price: 5999,
            }]
          )
        }, 100);
      });
      yield put({type: 'save', payload: {products}});
    },
    * fetchHots({payload}, {call, put}) {  // eslint-disable-line
      console.log(`>>>> start fetch hots`);
      let res = yield fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET', body: null});
      // let res = yield fetch('http://localhost:3001', {method: 'GET', body: null});
      console.log(`>>>> fetch res: @`);
      console.dir(res);
    },
  },

  reducers: {
    save(state, action) {
      return {...state, ...action.payload};
    },
    addProduct(state, {product}) {
      console.log('>>>>>> exec addProduct');
      return {...state, products: [...state.products, product]};
    }
  },

};
