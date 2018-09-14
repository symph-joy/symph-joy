import React from 'react';
import 'antd/dist/antd.css';
import Head from '@symph/joy/head';
import {LocaleProvider} from 'antd';
import Dynamic from '@symph/joy/dynamic';
// import getConfig from '@symph/joy/config';
import {Switch, Route, Redirect} from '@symph/joy/router';
import zhCN from 'antd/lib/locale-provider/zh_CN';

// const {publicRuntimeConfig} = getConfig();

// 加载业务组件 
import Loading from './components/Loading';

// 打印错误
if (typeof window !== "undefined") {
  window.onerror = function (errorMessage, scriptURI, lineNumber, columnNumber, errorObj) {
    if (publicRuntimeConfig.env === 'beta') {
      const err = {
        "错误信息：": errorMessage,
        "出错文件：": scriptURI,
        "出错行号：": lineNumber,
        "出错列号：": columnNumber,
        "错误详情：": errorObj
      };
      alert(JSON.stringify(err));
    }
  };
}

// 动态加载组件
const dynamic = function (comp) {
  return Dynamic(comp, {
    loading: Loading
  })
};

const AppController = dynamic(import('./controllers/AppController'));
const AboutController = dynamic(import('./controllers/AboutController'));
const IndexController = dynamic(import('./controllers/IndexController'));
const ListController = dynamic(import('./controllers/ListController'));
const AddController = dynamic(import('./controllers/AddController'));

export default () => {
  return (
    <React.Fragment>
      <Head>
        <title>Antd Demo</title>
      </Head>
      <LocaleProvider locale={zhCN}>
        <AppController>
          <Switch>
            <Route exact path="/main/index" component={IndexController} />
            <Route exact path="/main/about" component={AboutController} />
            <Route exact path="/main/data/list" component={ListController} />
            <Route exact path="/main/data/add" component={AddController} />
            <Route exact path="/" component={() => <Redirect to="/main/index" />} />
            <Route exact component={() => <Redirect to="/" />} />
          </Switch>
        </AppController>
      </LocaleProvider>
    </React.Fragment>
  );
};

