import model from 'symphony-joy/model'

@model()
export default class UserModel {

  namespace = 'user';

  state = {
    me: null,
  };

  async fetchMyInfo() {
    console.log('>>>>>> user model get action fetchMe');
    let me = await new Promise((resolve, reject) => {
      setTimeout(() => {

        resolve({
          id: 1,
          name: 'lane lee',
          age: 18,
        })
      }, 200);
    });
    console.log('>>>>>> finish async fetchMe');
    await this.setState({me});
  }

};

