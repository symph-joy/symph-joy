import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteSwitch } from "@symph/react";
import { Layout, Menu, Breadcrumb, Row, Col, AutoComplete } from "antd";
import { Autowire } from "@symph/core";
import { UserOutlined, LaptopOutlined, NotificationOutlined } from "@ant-design/icons";
import { DocsModel } from "../model/docs.model";
import _ from 'lodash'
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;
const { Option } = AutoComplete

import styles from "./layout.less";

@ReactController()
export default class MainLayout extends ReactBaseController {
  @Autowire()
  public docsModel: DocsModel;

  onChange = async (value) => {
    const result  = await this.docsModel.getSearch(value)
  }
  jump = (value) => {
    if (value.children) {
      this.props.history.push(`/docs${value.path}${value.children[0].id}`)
    } else {
      this.props.history.push(`/docs${value.path}`)
    }
  }
  renderView(): ReactNode {
    const { location, route } = this.props;
    const { result } = this.docsModel.state
    console.log(location)
    return (
      <>
        <Layout data-theme="light">
          <Header className={styles.appHeader}>
            <Row>
              <Col className={styles.logo} sm={24} md={6} lg={6} xl={5} xxl={4}>
                <a id="logo" href="/index-cn">
                  <img alt="logo" style={{ height: 32, marginRight: 12 }} src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
                  Symph Joy
                </a>
              </Col>
              <Col flex={1}>
                <Menu mode="horizontal" defaultSelectedKeys={["1"]}>
                  <Menu.Item key="1">开始</Menu.Item>
                  <Menu.Item key="2">配置</Menu.Item>
                  <Menu.Item key="3">API</Menu.Item>
                  <Menu.Item key="4">指南</Menu.Item>
                  <Menu.Item key="5">插件</Menu.Item>
                </Menu>
              </Col>
              <Col sm={24} md={4} lg={4} xl={4} xxl={4}>
                <AutoComplete className={styles.search} onChange={_.debounce(this.onChange, 100)} style={{ width: 200 }}>
                  {
                    result.map((value, key) => 
                    <Option key={key} value={value.text}>
                      {
                        value.children ? <a onClick={() => this.jump(value)} className={styles.selectOption}>{value.text} &gt; {value.children[0].text}</a> : <a onClick={() => this.jump(value)} className={styles.selectOption}>{value.text}</a>
                      } 
                    </Option>
                    )
                  }
                </AutoComplete>
              </Col>
            </Row>
          </Header>
          <Content className={styles.appContent}>
            <RouteSwitch routes={route?.routes || []} extraProps={null} />
          </Content>
        </Layout>
      </>
    );
  }
}
