import styles from './index.less';
import React, {PureComponent} from 'react';
import Head from '@symph/joy/head';
import {menus} from '../../config/constant';
import {Layout} from 'antd';
import Sider from '../../components/Sider'
import Header from '../../components/Header'

export default class AppController extends PureComponent {
  static state = {
    inlineCollapsed: false, // 菜单栏是否折叠
  };

  // 切换菜单栏折叠状态
  changeCollapsed = () => {
    const {inlineCollapsed} = this.state;
    this.setState({inlineCollapsed: !inlineCollapsed});
  };

  render() {
    return (
      <React.Fragment>
        <Head>
          <title>首页 - antd-design</title>
        </Head>
        <Layout className={styles.page} hasSider>
          <Layout.Sider className={styles.siderBox}>
            <Sider menus={menus} />
          </Layout.Sider>
          <Layout>
            <Layout.Header className={styles.headerBox}>
              <Header changeCollapsed={this.changeCollapsed} />
            </Layout.Header>
            <Layout.Content className={styles.content}>
              {this.props.children}
            </Layout.Content>
          </Layout>
        </Layout>
      </React.Fragment>
    );
  }
};
