import React, { ReactNode } from "react";
import { BaseReactController, RouteSwitch, ReactController, RouteParam } from "@symph/react";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Inject } from "@symph/core";
import { Affix, Col, Menu, Row, Anchor, Drawer } from "antd";
import styles from "./docs.less";
import { MenuUnfoldOutlined } from "@ant-design/icons";
const { Link } = Anchor;

@ReactController()
export default class DocsLayout extends BaseReactController {
  @RouteParam({ name: "path" })
  docPath: string;

  @Inject()
  public docsModel: DocsModel;

  state = {
    showDrawer: false,
  };

  private async showDoc(menu: DocMenuItem) {
    this.props.history.push(`/docs${menu.path}`);
  }

  private renderMenuItem(items: DocMenuItem[] | undefined) {
    if (!items || items.length === 0) {
      return undefined;
    }
    const views = [];
    for (const item of items) {
      const { children, title, path } = item;
      if (children) {
        views.push(
          <Menu.SubMenu key={path} title={title}>
            {this.renderMenuItem(children)}
          </Menu.SubMenu>
        );
      } else {
        views.push(
          <Menu.Item key={path} onClick={this.showDoc.bind(this, item)}>
            {title}
          </Menu.Item>
        );
      }
    }
    return views;
  }

  renderView(): ReactNode {
    const { docMenus, defaultOption, titleTrees, currentDoc } = this.docsModel.state;
    const { route } = this.props;
    return (
      <Row className="={styles.row" style={{ minHeight: "calc(100vh - 64px)", position: "relative" }}>
        <Col className={styles.menu} sm={24} md={5} lg={5} xl={4} xxl={3}>
          <Affix>
            <Menu
              selectedKeys={[currentDoc?.path]}
              mode="inline"
              openKeys={defaultOption}
              style={{ height: "calc(100vh - 64px)" }}
              className={styles.docMenus}
            >
              {this.renderMenuItem(docMenus)}
            </Menu>
          </Affix>
        </Col>
        <div
          className={styles.menuIcon}
          onClick={() => {
            this.setState({
              showDrawer: true,
            });
          }}
        >
          <MenuUnfoldOutlined />
        </div>
        <Drawer
          placement="left"
          onClose={() => {
            this.setState({
              showDrawer: false,
            });
          }}
          visible={this.state.showDrawer}
        >
          <Menu
            selectedKeys={[currentDoc?.path]}
            mode="inline"
            openKeys={defaultOption}
            style={{ height: "calc(100vh - 64px)" }}
            className={styles.docMenus}
          >
            {this.renderMenuItem(docMenus)}
          </Menu>
        </Drawer>
        <Col style={{ flex: 1 }}>
          <RouteSwitch routes={route?.routes || []} extraProps={null} />
        </Col>
        <Col sm={24} md={3} lg={3} xl={3} xxl={3}>
          {titleTrees ? (
            <Anchor className={styles.titleTree}>
              {titleTrees.map((value, key) => {
                if (value.children) {
                  return (
                    <Link key={key} href={value.id} title={value.text}>
                      {value.children.map((child, k) => (
                        <Link key={k} href={child.id} title={child.text} />
                      ))}
                    </Link>
                  );
                } else {
                  return <Link key={key} href={value.id} title={value.text} />;
                }
              })}
            </Anchor>
          ) : undefined}
        </Col>
      </Row>
    );
  }
}
