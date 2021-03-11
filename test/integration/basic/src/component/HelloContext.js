import React from 'react'
import PropTypes from 'prop-types'

export default class HelloContext extends React.Component {
  static contextTypes = {
    data: PropTypes.object
  }

  render () {
    const { data } = this.context
    return (
      <div>hello content {data.title}</div>
    )
  }
}
