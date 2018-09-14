import React, { Component } from 'react'
import 'antd/dist/antd.css'
import Head from '@symph/joy/head'
import { LocaleProvider } from 'antd'
import dynamic from '@symph/joy/dynamic'
import { Switch, Route, Redirect } from '@symph/joy/router'
import zhCN from 'antd/lib/locale-provider/zh_CN'
import AppController from './controllers/AppController'

// 加载业务组件 
import loading from './components/Loading'

const AboutController = dynamic({loader: () => import('./controllers/AboutController'), loading})
const IndexController = dynamic({loader: () => import('./controllers/IndexController'), loading})
const ListController = dynamic({loader: () => import('./controllers/ListController'), loading})
const AddController = dynamic({loader: () => import('./controllers/AddController'), loading})

export default class Main extends Component {
  render () {
    return (
      <div>
        <Head>
          <title>Antd Demo</title>
        </Head>
        <LocaleProvider locale={zhCN}>
          <AppController>
            <Switch>
              <Route exact path="/about" component={AboutController}/>
              <Route exact path="/data/list" component={ListController}/>
              <Route exact path="/data/add" component={AddController}/>
              <Route path="/" component={IndexController}/>
            </Switch>
          </AppController>
        </LocaleProvider>
      </div>
    )
  }
};

