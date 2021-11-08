import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteSwitch } from "@symph/react";
import { Layout, Menu, Breadcrumb, Row, Col } from "antd";
import { UserOutlined, LaptopOutlined, NotificationOutlined } from "@ant-design/icons";

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

import styles from "./layout.less";

@ReactController()
export default class MainLayout extends ReactBaseController {
  renderView(): ReactNode {
    const { location, route } = this.props;
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
