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
  hash: string;
  state = {
    showDrawer: false,
  };

  async initialModelStaticState(): Promise<void | number> {
    let path = this.docPath || "/docs/docs/start/introduce";
    await this.fetchPageDocData(path);
  }

  async fetchPageDocData(path) {
    if (!path.startsWith("/")) {
      path = "/docs/" + path;
    }
    await this.docsModel.getDoc(path);
  }

  componentDidUpdate() {
    this.scrollEle();
  }

  scrollEle() {
    const hash = window.location.hash?.slice(1);
    if (!hash) {
      window.scrollTo(0, 0);
      this.hash = "";
    } else {
      if (this.hash !== hash) {
        const ele = document.getElementById(hash);
        if (ele) {
          this.hash = hash;
          ele.scrollIntoView();
        }
      }
    }
  }

  observe = (selector, callback) => {
    let startTime = Date.now();
    // 检测超时, 最长 30s
    let MAX_OBSERVE_TIME = 30e3;

    let found = false;

    // 每隔 100ms 检测一次页面元素是否存在
    let intervalId = setInterval(function () {
      // 务必注意 return, 即 结束方法
      if (found) {
        clearInterval(intervalId);
        return;
      }
      let elapse = Date.now() - startTime;
      if (elapse > MAX_OBSERVE_TIME) {
        // console.log(`${selector} 元素检测超时 ${elapse} ms, 停止检测`);
        clearInterval(intervalId);
        return;
      }

      let element = document.getElementById(selector);

      // 如果没值, 则 return
      if (!element) {
        // console.log(`${selector} 元素不存在`);
        return;
      }
      found = true;
      // 向回调函数中传入 this
      callback(element);
    }, 100);
  };

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
        if (menu.children?.length) {
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
