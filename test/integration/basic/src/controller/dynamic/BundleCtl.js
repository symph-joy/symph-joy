import React from 'react'
import dynamic from '@symph/joy/dynamic'
import controller from '@symph/joy/controller'
import {routerRedux} from '@symph/joy/router'
import PropTypes from 'prop-types'

const HelloBundle = dynamic({
  modules: {
      HelloContext: () => import('../../component/HelloContext'),
      Hello1: () => import('../../component/Hello1'),
      Hello2: () => import('../../component/Hello2')
  },
  render: (props, { HelloContext, Hello1, Hello2 }) => (
    <div>
      <h1>{props.title}</h1>
      <HelloContext />
      <Hello1 />
      {props.showMore ? <Hello2 /> : null}
    </div>
  )
})

@controller((state, {location})=>({
  showMore: location.search &&location.search.match(/showMore=([^&#])/)[1]
}))
export default class BundleCtl extends React.Component {
  static childContextTypes = {
    data: PropTypes.object 
  }

  getChildContext () {
    return {
      data: { title: 'joy' }
    }
  }

  toggleShowMore () {
    if (this.props.showMore) {
      this.props.dispatch(routerRedux.push('/dynamic/bundle'))
      return
    }
    this.props.dispatch(routerRedux.push('/dynamic/bundle?showMore=1'))
  }

  render () {
    const { showMore } = this.props
    return (
      <div>
        <HelloBundle showMore={showMore} title="Dynamic Bundle"/>
        <button
          id="toggle-show-more"
          onClick={() => this.toggleShowMore()}
        >
          Toggle Show More
        </button>
      </div>
    )
  }
}
