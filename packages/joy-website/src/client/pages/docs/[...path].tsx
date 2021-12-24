import React, { ReactNode } from "react";
import { BaseReactController, ReactController, RouteParam, ReactComponent } from "@symph/react";
import { Spin } from "antd";
import styles from "./docs.less";
import { Prerender, IJoyPrerender, TJoyPrerenderApi } from "@symph/joy/react";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Inject, IApplicationContext } from "@symph/core";

@Prerender()
@ReactComponent()
export class DocsPrerenderGenerator implements IJoyPrerender {
  @Inject()
  public docsModel: DocsModel;

  getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
    return "/docs/:path";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    const menus = await this.docsModel.getDocMenus();
    const paths = [] as string[];
    const addChildren = (menus: DocMenuItem[]) => {
      (menus || []).forEach((menu) => {
        if (menu.children?.length) {
          addChildren(menu.children);
        } else {
          paths.push(`/docs${menu.path}`);
        }
      });
    };
    addChildren(menus || []);
    return paths;
  }

  async getApis?(): Promise<Array<TJoyPrerenderApi>> {
    let paths = await this.docsModel.getPreDocMenus();
    paths = paths.map((value) => {
      return {
        path: value.detail,
      };
    });
    return [
      {
        path: "/docs/menus",
      },
      ...paths,
    ];
  }
}

@ReactController()
export default class Path extends BaseReactController {
  @RouteParam({ name: "path" })
  docPath: string;

  @Inject()
  public docsModel: DocsModel;

  state = {
    showDrawer: false,
  };

  async initialModelStaticState(): Promise<void | number> {
    let path = this.docPath || "/docs/docs/style-css";
    await this.docsModel.getDocMenus();
    await this.fetchPageDocData(path);
  }

  async fetchPageDocData(path) {
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    await this.docsModel.getDoc(path);
  }

  renderView(): ReactNode {
    const { currentDoc, loadCurrentDocErr, loadingCurrentDoc } = this.docsModel.state;
    return (
      <Spin delay={200} spinning={loadingCurrentDoc}>
        {loadCurrentDocErr ? (
          <div>
            {" "}
            {loadCurrentDocErr.code}:{loadCurrentDocErr.message}
          </div>
        ) : undefined}
        {currentDoc ? <div className={styles.docContent} dangerouslySetInnerHTML={{ __html: currentDoc.htmlContent }} /> : undefined}
      </Spin>
    );
  }
}
