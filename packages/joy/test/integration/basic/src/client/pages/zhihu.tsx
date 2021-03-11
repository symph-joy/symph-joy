import React, { Component, ReactNode } from "react";
import { ZhiHuModel } from "../models/ZhiHuModel";
import { Controller, ReactController } from "@symph/react";
import { Inject } from "@symph/core";

// @Route({path: '/aaa/zhihu'})
@Controller()
export default class ZhiHuController extends ReactController {
  componentDidMount() {
    super.componentDidMount();
    this.zhiHuModel.getRecent();
  }

  @Inject(ZhiHuModel)
  private zhiHuModel: ZhiHuModel;

  renderView(): ReactNode {
    const { recent } = this.zhiHuModel.state;
    return (
      <div>
        <h1>ZhiHu Recent Articlesdddffff</h1>
        <button onClick={() => this.zhiHuModel.getRecent()}>refresh</button>
        <div>
          {recent
            ? recent.map((article) => (
                <a href={article.url} target="view_window">
                  <h5>{article.title}</h5>
                  <div>{article.url}</div>
                </a>
              ))
            : "loading..."}
        </div>
      </div>
    );
  }
}
