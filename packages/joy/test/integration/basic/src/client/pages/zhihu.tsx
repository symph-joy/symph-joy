import React, { ReactNode } from "react";
import { ZhiHuModel } from "../models/ZhiHuModel";
import { ReactBaseController, ReactController } from "@symph/react";
import { Autowire } from "@symph/core";

// @Route({path: '/aaa/zhihu'})
@ReactController()
export default class ZhiHuController extends ReactBaseController {
  async initialModelState(context: any): Promise<void> {
    await this.zhiHuModel.getRecent();
  }

  @Autowire(ZhiHuModel)
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
