import React, { Component } from 'react'
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'todos', // app name registered
    entry: '//localhost:3000',
    // entry: 'http://10.222.8.35:8000/apps/fe_megrez_loan_admin/index.html',
    container: '#micro-app-root',
    activeRule: '/todos',
  }
]);


export default class Index extends Component {

  componentDidMount () {
    start()
  }

  render () {
    return (
      <div>
      <div style={{backgroundColor:'#001529', color:'#fff', fontSize: 16, height: 64, lineHeight: '64px'}}>Host Header</div>
      <div id='micro-app-root' style={{backgroundColor: '#f0f2f5', minHeight: '100vh'}}>sub app container</div>
    </div>)
  }

}
