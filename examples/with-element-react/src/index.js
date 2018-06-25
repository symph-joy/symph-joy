import React from 'react'
import { Button } from 'element-react'
import styles from './index.less'  // example for with less

import 'element-theme-default'

export default class Main extends React.Component {
  render () {
    return (<div className={styles.root}>
      <Button type='primary'>Hello</Button>
    </div>)
  }
}
