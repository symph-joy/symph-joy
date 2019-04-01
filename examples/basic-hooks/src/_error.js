import React from 'react'
import Head from '@symph/joy/head'

export default class _error extends React.Component {
  render () {
    const {statusCode, message} = this.props
    return <div>
      <Head>
        <title>ERROR</title>
      </Head>
      <div>
        <div>异常详情</div>
        <div>statusCode:{statusCode}</div>
        <div>message:{message}</div>
      </div>
    </div>
  }
}
