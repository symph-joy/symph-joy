import React, { ReactNode } from "react";
import { BaseReactController, ReactController, RouteParam } from "@symph/react";
import { Outlet } from "@symph/react/router-dom";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Inject } from "@symph/core";
import { Affix, Menu, Anchor, Drawer } from "antd";
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

  async initialModelStaticState(): Promise<void | number> {
    // let path = this.docPath || "/docs/docs/style-css";
    console.log("props:", this.props);
    // await this.docsModel.getDocMenus(`/${this.props.location.pathname.split("/")[1]}`);
  }

  private async showDoc(menu: DocMenuItem) {
    this.props.navigate(`/docs${menu.path}`);
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
  onOpenChange = (openKeys) => {
    this.docsModel.changeOpenKeys(openKeys);
  };

  renderView(): ReactNode {
    const { docMenus, openKeys, titleTrees, currentDoc } = this.docsModel.state;
    return (
      <div className={styles.layoutContent}>
        <Affix>
          <Menu
            selectedKeys={[currentDoc?.path]}
            mode="inline"
            openKeys={openKeys}
            style={{ height: "calc(100vh - 64px)" }}
            className={styles.docMenus}
            onOpenChange={this.onOpenChange}
          >
            {this.renderMenuItem(docMenus)}
          </Menu>
        </Affix>
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
          <Menu selectedKeys={[currentDoc?.path]} mode="inline" openKeys={openKeys} style={{ height: "calc(100vh - 64px)" }}>
            {this.renderMenuItem(docMenus)}
          </Menu>
        </Drawer>
        <div className={styles.center}>
          <Outlet />
        </div>
        <div className={styles.titleTree}>
          {titleTrees ? (
            <Anchor>
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
        </div>
      </div>
    );
  }
}
