import React from 'react'

export default class Error extends React.Component {
  state = { didMount: false }

  componentDidMount () {
    this.setState({
      didMount: true
    })
  }

  render () {
    const { statusCode, message } = this.props
    const { didMount } = this.state
    return (<div>
      <div>{`didMount:${didMount}`}</div>
      <div>{`${statusCode}:${message}`}</div>
    </div>)
  }
}
