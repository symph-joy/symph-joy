import model from '@symph/joy/model'

@model()
export default class BasicModel {
  namespace = 'basic'
  initState = {
    hello: 'hello from model', // const state
    hasFetchData: false, // only write only
    todos: null, // write twice
    multiEditState: 0,
    dispatchResult: 0,
    jsonState: null,
    jsonStoreState: null
  }

  async fetchTodos () {
    this.setState({
      hasFetchData: true,
    })

    const newTodos = await new Promise((resolve, reject) => {setTimeout(resolve.bind(null, ['todo-init'])), 10})

    const {todos} = this.getState()
    this.setState({
      todos: [...(todos || []), ...newTodos]
    })
  }

  async addTodo({todo}) {
    const {todos} = this.getState()
    this.setState({
      todos: [...todos, todo]
    })
    return todo
  }

  async autoAddTodo(){
    let result = await this.dispatch({
      type: 'basic/addTodo',
      todo: 'todo-auto-add-by-model'
    })
    this.setState({
      dispatchResult: result
    })
  }

  async tryGetState(){
    this.setState({
      jsonState: JSON.stringify(this.getState())
    })
  }

  async tryGetStoreState(){
    this.setState({
      jsonStoreState: JSON.stringify(this.getStoreState())
    })
  }

  async multiEditState(){
    this.setState({
      multiEditState: 1
    })
    this.setState({
      multiEditState: 2
    })
    this.setState({
      multiEditState: 3
    })
  }
}
