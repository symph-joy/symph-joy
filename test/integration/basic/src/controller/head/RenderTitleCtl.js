import React from 'react'
import Head from '@symph/joy/head'

export default class RenderTitleCtl extends React.Component {
  render () {
    return (
      <div>
        <Head>
          <title>hello title</title>
        </Head>
        <div>set title of document </div>
      </div>
    )
  }
}
