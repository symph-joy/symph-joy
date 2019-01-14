export default {
  namespace: 'dva',
  state: {
    msg: 'hello from dav model',
    prepare: 0,
    reducer: '',
    count: 0,
  },
  effects: {
    *prepare ( action, {call, put}) {
      const newPrepareValue = yield call(() => new Promise((resolve, reject) => setTimeout(() => resolve(1), 10)))
      yield put({type: 'dva/callReducer', payload: {prepare: newPrepareValue}})
    },
    * callEffect ({count, add}, {call, put}) {
      const newCount = yield call(() => new Promise((resolve, reject) => setTimeout(() => resolve(count + add), 10)))
      yield put({type: 'dva/callReducer', payload: {count: newCount}})
    }
  },
  reducers: {
    callReducer (state, {payload}) {
      return Object.assign({}, state, payload)
    }
  }
}
