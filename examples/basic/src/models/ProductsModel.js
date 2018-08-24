import model from '@symph/joy/model'

@model()
export default class ProductsModel {

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
      }, 1000)
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

};

