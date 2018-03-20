
export default {

  namespace: 'user',

  state: {
    me: null,
  },

  subscriptions: {
      setup({ dispatch, history }) {  // eslint-disable-line
         console.log('>>>>>> userModel subscription');
      },
  },

  effects: {
    *fetchMe({ payload }, { call, put }) {  // eslint-disable-line
      console.log('>>>>>> user model get action fetchMe');
      let me = yield new Promise((resolve, reject)=>{
        setTimeout(()=>{
          console.log('>>>>>> finish async fetchMe');
          resolve({
              id: 1,
              name:'lane lee',
              age: 18,
            })
        }, 2000);
      });

      yield put({ type: 'save', payload: {me}});
      return 'aaaa';
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
