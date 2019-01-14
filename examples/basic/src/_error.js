import React from 'react'
import Head from '@symph/joy/head'

export default class _error extends React.Component {
  render () {
    const {error} = this.props
    return <div>
      <Head>
        <title>ERROR</title>
      </Head>
      <div>
        异常详情：{JSON.stringify(err)}
      </div>
    </div>
  }
}
