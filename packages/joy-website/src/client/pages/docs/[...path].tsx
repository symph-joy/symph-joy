import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteParam } from "@symph/react";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Autowire } from "@symph/core";
import { Affix, Col, Menu, Row, Spin, Anchor } from "antd";
import styles from "./docs.less";

const { Link } = Anchor;
@ReactController()
export default class DocsIndexController extends ReactBaseController {
  @RouteParam({ name: "path" })
  docPath: string;

  @Autowire()
  public docsModel: DocsModel;

  async initialModelStaticState(): Promise<void | number> {
    let path = this.docPath;
    await this.docsModel.getDocMenus();
    await this.fetchPageDocData(path);
  }

  async fetchPageDocData(path) {
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    await this.docsModel.getDoc(path);
    await this.docsModel.getTitleTree(path);
  }

  shouldComponentUpdate(pre: any, next: any, nextContext: any) {
    const oldPath = this.docPath;
    super.shouldComponentUpdate(pre, next, nextContext);
    const newPath = this.docPath;
    if (oldPath !== newPath) {
      this.fetchPageDocData("/" + newPath);
    }
    return true;
  }

  private async showDoc(menu: DocMenuItem) {
    this.props.history.push(`/docs${menu.path}`);
    await this.docsModel.getDoc(menu.path);
    await this.docsModel.getTitleTree(menu.path);
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
    const { docMenus, titleTrees, currentDoc, loadCurrentDocErr, loadingCurrentDoc } = this.docsModel.state;
    console.log(this.docPath);
    return (
      <Row style={{ minHeight: "calc(100vh - 64px)", position: "relative" }}>
        <Col sm={24} md={6} lg={6} xl={5} xxl={4}>
          <Affix>
            <Menu mode="inline" style={{ height: "calc(100vh - 64px)" }} className={styles.docMenus}>
              {this.renderMenuItem(docMenus)}
            </Menu>
          </Affix>
        </Col>
        <Col flex={"1 0"}>
          <Spin delay={200} spinning={loadingCurrentDoc}>
            {loadCurrentDocErr ? (
              <div>
                {" "}
                {loadCurrentDocErr.code}:{loadCurrentDocErr.message}
              </div>
            ) : undefined}
            {currentDoc ? <div className={styles.docContent} dangerouslySetInnerHTML={{ __html: currentDoc.htmlContent }} /> : undefined}
          </Spin>
        </Col>
        <Col sm={24} md={2} lg={2} xl={2} xxl={2}>
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
