import React from 'react'
import dynamic from '@symph/joy/dynamic'

const EditFileCtl = dynamic({loader: () => import('./EditFileCtl.js')})

export default class DynamicComponentCtl extends React.Component {
  render () {
    return (
      <div>
        <div id={'hello'}>hello from DynamicComponentCtl</div>
        <EditFileCtl/>
      </div>
    )
  }
}
