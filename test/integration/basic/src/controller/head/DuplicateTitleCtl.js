import React from 'react'
import Head from '@symph/joy/head'

export default class DuplicateTitleCtl extends React.Component {
  render () {
    return (
      <div>
        <Head>
          <title>first title</title>
        </Head>
        <Head>
          <title>second title</title>
        </Head>
        <div>duplicate title of document, only the last one should rendered</div>
      </div>
    )
  }
}
