import React, { ReactNode } from "react";
import { BaseReactController, ReactController, RouteParam, ReactComponent } from "@symph/react";
import { Spin } from "antd";
import styles from "./docs.less";
import { Prerender, IJoyPrerender, TJoyPrerenderApi } from "@symph/joy/react";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Inject } from "@symph/core";

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
    console.log("123123123");

    let path = this.docPath || "/docs/docs/introduce";
    await this.docsModel.getDocMenus(`/${this.docPath.split("/")[0]}`);
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

@Prerender({ routeComponent: Path })
export class DocsPrerenderGenerator implements IJoyPrerender {
  @Inject()
  public docsModel: DocsModel;

  // getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
  //   return "/docs/*";
  // }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    const menus = await this.docsModel.getAllDocsMenus();
    const paths = [] as string[];
    const addChildren = (menus: DocMenuItem[]) => {
      (menus || []).forEach((menu) => {
        if (menu.children.length) {
          addChildren(menu.children);
        } else {
          paths.push(`${menu.path}`);
        }
      });
    };
    addChildren(menus || []);
    return paths;
  }

  async getApis?(): Promise<Array<TJoyPrerenderApi>> {
    return [
      {
        path: "/docs/titleArray",
      },
    ];
  }
}
