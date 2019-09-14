import React, { Component } from 'react'
import fetch from '@symph/joy/fetch'

export default class Index extends Component {

  state = {
    news: []
  }

  async componentDidMount () {
    let response = await fetch('https://news-at.zhihu.com/api/3/news/hot', {method: 'GET'})
    let data = await response.json()
    this.setState({
      news: data.recent
    })
  }

  render () {
    let {news} = this.state
    return <div>
      <div>Welcome to @symph/joy!</div>
      {(news || []).map(item => {
        return (<div key={item.news_id}>{item.title}</div>)
      })}
    </div>
  }

}
