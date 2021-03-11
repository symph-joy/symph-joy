import React from 'react'
import Head from '@symph/joy/head'

export default class WithHeadCtl extends React.Component {
  render () {
    return (
      <div>
        <Head>
          <title>title from dynamic component</title>
        </Head>
        <div>dynamic load component, with a head</div>
      </div>
    )
  }
}
