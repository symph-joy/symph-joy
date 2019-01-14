import model from '@symph/joy/model'

@model()
class ProductsModel {

  //the mount point of store state tree, must unique in the app.
  namespace = 'products'

  //this is the initial state of model
  initState = {
    pageIndex: null,
    pageSize: 5,
    products: [],
    details:{}
  }

  /**
   *  fetch product list from server
   * @param pageIndex
   * @param pageSize
   * @returns {Promise<void>}
   */
  async getProducts ({pageIndex = 1, pageSize = 5}) {
    //fetch data
    let data = await new Promise((resolve, reject) => {
      //mock
      setTimeout(() => {
        let resultData = []
        for (let i = (pageIndex - 1) * pageSize; i < pageIndex * pageSize; i++) {
          resultData.push({
            id: i,
            name: 'iphone 8',
            price: 4999,
          })
        }
        resolve(resultData)
      }, 200)
    })

    let {products} = this.getState() //get the current state of model
    if (pageIndex === 1) {
      products = data
    } else {
      products = [...products, ...data]
    }

    this.setState({
      products,
      pageIndex,
      pageSize
    })
  }

  /**
   * fetch product detail info from server
   * @param productId
   * @returns {Promise<void>}
   */
  async getProduct ({productId}) {
    let {details} = this.getState();

    //fetch data
    let data = await new Promise((resolve, reject) => {
      //mock
      setTimeout(() => {
        resolve({
          id: productId,
          name: 'iphone 8',
          price: 4999,
        })
      }, 500)
    })

    this.setState({
      details: {...details, [productId]: data}
    })
  }

  /**
   * add a new product
   * @param product
   * @returns {Promise<void>}
   */
  async addProduct ({product}) {
    let {products} = this.getState()

    this.setState({
      products: [product, ...products]
    })
  }

}

// function model(value) {
//   return function decorator (Model) {
//     Model.elements.push({
//       kind:"field",
//       key:"_type",
//       placement:"static",
//       descriptor:{"writable":false,"configurable":true,"enumerable":false},
//       initializer: function () {
//         return '__MODEL'
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"init",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function (app) {
//           this._app = app
//           this.store = app._store
//           this.dispatch = this.store.dispatch
//         }
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"_checkInit",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function () {
//           if (!this.store) {
//             throw new Error(`must use @requireModel(${Model}) decorator on class, before use it`)
//           }
//         }
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"setState",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function (nextState) {
//           this._checkInit()
//           const action = {
//             type: this.namespace + '/__SET_STATE',
//             nextState
//           }
//           return this.dispatch(action)
//         }
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"getState",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function (nextState) {
//           this._checkInit()
//           return this.store.getState()[this.namespace]
//         }
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"getStoreState",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function () {
//           this._checkInit()
//           return this.store.getState()
//         }
//       }
//     })
//
//     Model.elements.push({
//       "kind":"method",
//       "key":"selectState",
//       "placement":"prototype",
//       "descriptor":{"writable":true,"configurable":true,"enumerable":false,
//         value:function () {
//           if(process.env.NODE_ENV === 'development'){
//             console.warn('mode selectState is deprecated, user getStoreState instead')
//           }
//           return this.getStoreState();
//         }
//       }
//     })
//
//     return Model;
//   }
// }

export default ProductsModel;

