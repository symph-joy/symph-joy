import React, { Component } from 'react'

export default class ImageView extends Component {
  render () {
    return <img src={require('./logo.jpg')} {...this.props}/>
  }
}
