import model from 'symphony-joy/model'

@model()
export default class ProductsModel {

  // the mount point of store state tree, must uniq in the app.
  namespace = 'products';

  // model has own state， this is the initial state
  initState = {
    pageIndex: null,
    pageSize: 5,
    products: [],
  };

  async getProducts({pageIndex = 1, pageSize = 5}) {
    console.log('>>>>> ProductsModel, getProducts, pageIndex:'+pageIndex+', pageSize:'+pageSize);
    // fetch data
    let data = await new Promise((resolve, reject) => {
      setTimeout(() => {
        let resultData = [];
        for (let i = (pageIndex - 1) * pageSize; i < pageIndex * pageSize; i++) {
          resultData.push({
            id: i,
            name: 'iphone 7',
            price: 4999,
          })
        }
        resolve(resultData)
      }, 200);
    });

    let {products} = this.getState();
    if (pageIndex === 1) {
      products = data;
    } else {
      products = [...products, ...data];
    }

    this.setState({
      products,
      pageIndex,
      pageSize
    });

    console.log('>>>>> ProductsModel, getProducts, end, products:' + products.length);
  }

  async addProduct({product}) {
    console.log('>>>>> addProduct')
    let {products} = this.getState();

    this.setState({
      products: [product, ...products]
    });
  }

};

