import React from 'react'
import { Link } from '@symph/joy/router'

export default class IndexController extends React.Component {
  render () {
    return <div>
      <div>IndexController</div>
      <div><Link to={'/controller/basic'}>/controller/basic</Link></div>
      <div><Link to={'/controller/autowire'}>/controller/autowire</Link></div>
      <div><Link to={'/controller/autowireWithType'}>/controller/autowireWithType</Link></div>
      <div><Link to={'/controller/prepare'}>/controller/prepare</Link></div>

      <div><Link to={'/model'}>/model</Link></div>
      <div><Link to={'/model/call'}>/model/call</Link></div>
      <div><Link to={'/dva/model'}>/dva/model</Link></div>
      <div><Link to={'/dva/prepare'}>/dva/prepare</Link></div>
      <div><Link to={'/head/renderTitle'}>/head/renderTitle</Link></div>
      <div><Link to={'/head/duplicateTitle'}>/head/duplicateTitle</Link></div>

      <div><Link to={'/dynamic/loadComponent'}>/dynamic/loadComponent</Link></div>
      <div><Link to={'/dynamic/bundle'}>/dynamic/bundle</Link></div>
      <div><Link to={'/dynamic/bundle?showMore=1'}>/dynamic/bundle?showMore=1</Link></div>
      <div><Link to={'/dynamic/withHead'}>/dynamic/withHead</Link></div>
      <div><Link to={'/redirect'}>/redirect</Link></div>
      <div><Link to={'/err500'}>/err500</Link></div>
    </div>
  }
}
