import React, {Component} from 'react'

export default class ImageView extends Component{
  render(){
    return <img src={require('./logo.jpg')}/>

    // return <div>here is the logo</div>
  }
}
