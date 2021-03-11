import model from '@symph/joy/model'

@model()
export default class CallModel {

  namespace = 'hooks'

  initState = {
    count: 1,
  }

  async add ({num}) {
    let {count} = this.getState()
    let newCount = count + num
    this.setState({
      count: newCount
    })
    return newCount
  }

}
