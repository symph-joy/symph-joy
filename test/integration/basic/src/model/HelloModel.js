import model from '@symph/joy/model'

@model()
export default class BasicModel {
  namespace = 'hello'

  initState = {
    message: 'hello from HelloModel',
  }

  async sayHello (message) {
    this.setState({
      message
    })
  }

}
