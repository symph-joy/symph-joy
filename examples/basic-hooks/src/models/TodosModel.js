import model from '@symph/joy/model'
import { autowire } from '@symph/joy/autowire'
import UserModel from './UserModel'

@model()
export default class TodosModel {

  //the mount point of store state tree, must unique in the app.
  namespace = 'todos'

  //this is the initial state of model
  initState = {
    pageIndex: 1,
    pageSize: 5,
    count: 0,
    entities: [],
    details: {}
  }

  @autowire()
  userModel: UserModel

  /**
   *  fetch todos from server
   */
  async getTodos ({pageIndex, pageSize = 5}) {
    // use other model
    if (!await this.userModel.hasLogin()) {
      throw new Error('has not login')
    }

    //fetch data from server
    let {list, count} = await new Promise((resolve, reject) => {
      //mock data
      setTimeout(() => {
        let list = [], count = RemoteMockData.length
        for(let i = (pageIndex-1) * pageSize; i < Math.min(count, pageIndex * pageSize); i++){
          list.push(RemoteMockData[i])
        }
        resolve({list, count})
      }, 200)
    })

    let {entities} = this.getState() //get the current state of model
    if(pageIndex > 1){
      list = [...entities, ...list]
    }

    this.setState({
      count,
      entities: list,
      pageIndex,
      pageSize
    })
  }

  /**
   * fetch to-do detail info from server
   * @param todoId
   * @returns {Promise<void>}
   */
  async getTodo (todoId) {
    let {details} = this.getState()

    //fetch data
    let data = await new Promise((resolve, reject) => {
      //mock
      setTimeout(() => {
        resolve(RemoteMockData.find(item => item.id === todoId))
      }, 500)
    })

    this.setState({
      details: {...details, [todoId]: data}
    })
  }

  /**
   * add a new todo
   * @param todo
   * @returns {Promise<void>}
   */
  async addTodo (todo) {
    let {entities, count} = this.getState()
    todo.id = count + 1

    //update data to server
    await new Promise((resolve, reject) => {
      //mock
      setTimeout(() => {
        RemoteMockData.unshift(todo)
        resolve()
      }, 100)
    })

    this.setState({
      entities: [todo, ...entities],
      count: count + 1
    })
  }

  async setHasFinished (todoId, hasFinished) {
    //update data to server
    await new Promise((resolve, reject) => {
      //mock
      setTimeout(() => {
        let todo = RemoteMockData.find(item => item.id === todoId)
        todo.hasFinished = hasFinished
        resolve()
      }, 100)
    })

    // update local date
    let {entities} = this.getState()
    let lcoalTodo = entities.find(item => item.id === todoId)
    lcoalTodo.hasFinished = hasFinished
    this.setState({
      entities: [...entities]
    })
  }

}

const RemoteMockData = [
  {
    id: 7,
    content: 'todo item',
    hasFinished: true
  },
  {
    id: 6,
    content: 'todo item',
    hasFinished: true
  },
  {
    id: 5,
    content: 'todo item',
    hasFinished: false
  },
  {
    id: 4,
    content: 'todo item',
    hasFinished: false
  },
  {
    id: 3,
    content: 'todo item',
    hasFinished: false
  },
  {
    id: 2,
    content: 'todo item',
    hasFinished: false
  },
  {
    id: 1,
    content: 'todo item',
    hasFinished: false
  },

]
