import model from '@symph/joy/model';
import fetch from '@symph/joy/fetch';
import {apiPath} from '../config/constant';

@model()
export default class AppModel {
  namespace = 'model';
  // 初始化数据
  initState = {
    list: []
  };

  // 添加项目
  async add({data}) {
    let {list} = this.getState();
    this.setState({list: list.concat([data])});
    return null;
  }

  // 删除项目
  async del({index}) {
    let {list} = this.getState();
    list = list.filter((l, key) => key !== index);
    this.setState({list});
    return null;
  }
}