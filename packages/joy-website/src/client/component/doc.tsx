import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Inject } from "@symph/core";
import { DocsModel } from "../model/docs.model";
@ReactController()
export default class Doc extends BaseReactController {
  @Inject()
  public docsModel: DocsModel;

  async initialModelStaticState(): Promise<void | number> {
    let path = this.props.path || "/docs/docs/start/introduce";
    await this.fetchPageDocData(path);
  }

  async fetchPageDocData(path) {
    if (!path.startsWith("/")) {
      path = "/docs/" + path;
    }
    await this.docsModel.getDoc(path);
  }

  renderView(): ReactNode {
    const { currentDoc } = this.docsModel.state;
    const className = this.props.className as string;
    return <>{currentDoc ? <div className={className} dangerouslySetInnerHTML={{ __html: currentDoc.htmlContent }} /> : undefined}</>;
  }
}
