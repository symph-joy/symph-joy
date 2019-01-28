import model from '@symph/joy/model'

@model()
export default class UserModel {
  namespace = 'user'
  initState = {}

  // 演示两个model之间如何调用，该方法会在TodosModel中调用
  async hasLogin () {
    // 模拟异步从服务端获取用户登录状态
    let hasLogin = await new Promise((resolve, reject) => {
      resolve(true)
    })
    return hasLogin
  }
}
