import model from '@symph/joy/model'

@model()
export default class CallModel {

  namespace = 'callModel'

  initState = {
    count: 0,
  }

  async add (num) {
    let {count} = this.getState()
    let newCount = count + num
    this.setState({
      count: newCount
    })
    return newCount
  }

}
