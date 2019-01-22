import model from '@symph/joy/model'

@model()
export default class TodosModel {

  //the mount point of store state tree, must unique in the app.
  namespace = 'todos'

  //this is the initial state of model
  initState = {
    pageSize: 5,
    count: 0,
    entities: [],
    details: {}
  }

  /**
   *  fetch todos list from server
   * @param lastId the last todoId of fetched data
   * @param pageSize
   * @returns {Promise<void>}
   */
  async getTodos ({lastId, pageSize = 5}) {
    //fetch data from server
    let {list, count} = await new Promise((resolve, reject) => {
      //mock data
      setTimeout(() => {
        let list = [], count = RemoteMockData.length
        if (!lastId) lastId = Number.MAX_VALUE
        for (let item of RemoteMockData) {
          if (item.id < lastId) {
            list.push(item)
            if (list.length >= pageSize) break
          }
        }
        resolve({list, count})
      }, 200)
    })

    let {entities} = this.getState() //get the current state of model

    entities = [...entities, ...list]

    this.setState({
      count,
      entities,
      pageSize
    })
  }

  /**
   * fetch product detail info from server
   * @param productId
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
   * add a new product
   * @param product
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

  async setHasFinished(todoId, hasFinished){
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
      entities : [...entities]
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
