import React from 'react'
import { Switch, Route } from '@symph/joy/router'
import dynamic from '@symph/joy/dynamic'
import IndexController from './controller/IndexController'

import BasicController from './controller/controller/BasicController'
import ControllerSetStateOnPrepareCtl from './controller/controller/SetStateOnPrepareCtl'
import AutowireCtl from './controller/controller/AutowireCtl'
import AutowireWithTypeCtl from './controller/controller/AutowireWithTypeCtl'
import PrepareCtl from './controller/controller/PrepareCtl'

import ModelController from './controller/model/ModelController'
import CallModelCtl from './controller/model/CallModelCtl'

import EditFileCtl from './controller/hmr/EditFileCtl'
import CounterCtl from './controller/hmr/CounterCtl'
import HMRHelloCtl from './controller/hmr/HMRHelloCtl'
import EditStyledJSXCtl from './controller/hmr/EditStyledJSXCtl'
import DynamicComponentCtl from './controller/hmr/DynamicComponentCtl'

import ERR404 from './controller/error/err_404'
import ERR302 from './controller/error/err_302'
import ERR302Target from './controller/error/err_302_target'
import ERR500 from './controller/error/err_500'
import HeadDuplicateTitleCtl from './controller/head/DuplicateTitleCtl'
import HeadRenderTitleCtl from './controller/head/RenderTitleCtl'
import DynamicBundleCtl from './controller/dynamic/BundleCtl'
import ModelCtl from './controller/dva/ModelCtl'
import ComponentPrepareCtl from './controller/dva/ComponentPrepareCtl'

import Hooks from './controller/hooks/Hooks'

const DynamicLoadComponent = dynamic({ loader: () => import('./component/Hello') }, { ssr: true })
const DynamicFunctionLoadComponent = dynamic(() => import('./component/Hello'))
const DynamicChunkFileName = dynamic({ loader: () => import(/* webpackChunkName: 'custom-hello-world' */'./component/ChunkFileName') })
const DynamicWithHeadCtl = dynamic({ loader: () => import('./controller/dynamic/WithHeadCtl'), ssr: true })
const DynamicNoSSR = dynamic({ loader: () => import('./component/Hello') }, {
  ssr: false,
  loading: () => <div>...</div>
})
const DynamicCustomLoading = dynamic({ loader: () => import('./component/Hello') }, {
  ssr: false,
  loading: () => <div>custom loading...</div>
})

export default class Main extends React.Component {
  render () {
    return (
      <Switch>
        <Route exact path={'/controller/basic'} component={BasicController} />
        <Route exact path={'/controller/setStateOnPrepare'} component={ControllerSetStateOnPrepareCtl} />
        <Route exact path={'/controller/autowire'} component={AutowireCtl} />
        <Route exact path={'/controller/autowireWithType'} component={AutowireWithTypeCtl} />
        <Route exact path={'/controller/prepare'} component={PrepareCtl} />

        <Route exact path={'/hook/api'} component={Hooks} />

        <Route exact path={'/model'} component={ModelController} />
        <Route exact path={'/model/call'} component={CallModelCtl} />
        <Route exact path={'/dva/model'} component={ModelCtl} />
        <Route exact path={'/dva/prepare'} component={ComponentPrepareCtl} />

        <Route exact path={'/dynamic/loadComponent'} component={DynamicLoadComponent} />
        <Route exact path={'/dynamic/function'} component={DynamicFunctionLoadComponent} />
        <Route exact path={'/dynamic/chunkFileName'} component={DynamicChunkFileName} />
        <Route exact path={'/dynamic/withHead'} component={DynamicWithHeadCtl} />
        <Route exact path={'/dynamic/noSSR'} component={DynamicNoSSR} />
        <Route exact path={'/dynamic/customLoading'} component={DynamicCustomLoading} />
        <Route exact path={'/dynamic/bundle'} component={DynamicBundleCtl} />

        <Route exact path={'/hmr/editFile'} component={EditFileCtl} />
        <Route exact path={'/hmr/counter'} component={CounterCtl} />
        <Route exact path={'/hmr/hello'} component={HMRHelloCtl} />
        <Route exact path={'/hmr/editStyle'} component={EditStyledJSXCtl} />
        <Route exact path={'/hmr/dynamicComp'} component={DynamicComponentCtl} />

        <Route exact path={'/head/renderTitle'} component={HeadRenderTitleCtl} />
        <Route exact path={'/head/duplicateTitle'} component={HeadDuplicateTitleCtl} />

        <Route exact path={'/redirect'} component={ERR302} />
        <Route exact path={'/302_target'} component={ERR302Target} />
        <Route exact path={'/err500'} component={ERR500} />

        <Route exact path={'/'} component={IndexController} />

        <Route component={ERR404} />
      </Switch>
    )
  }
}
