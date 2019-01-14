import React from 'react'

export default class Main extends React.Component {
  render () {
    throw new Error('error from render')
    return (
      <div>demo for custom error page</div>
    )
  }
}
