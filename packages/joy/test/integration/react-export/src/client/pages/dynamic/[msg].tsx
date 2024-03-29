import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute, RouteParam } from "@symph/react";
import { Inject, IApplicationContext } from "@symph/core";
import { IJoyPrerender, Prerender } from "@symph/joy/react";
import { DynamicMsgModel } from "../../model/dynamic-msg-model";

@ReactRoute({ path: "/dynamic/:msg" })
@ReactController()
export default class DynamicRouteCtl extends BaseReactController {
  async initModelStaticState(): Promise<void> {
    await this.dynamicMsgModel.fetchMessage(this.msg);
    return;
  }

  async initModelState(): Promise<void> {
    return;
  }

  @RouteParam()
  private msg: string;

  @Inject()
  public dynamicMsgModel: DynamicMsgModel;

  onClickLink = (link: string) => {
    this.props.navigate(link);
  };

  renderView(): ReactNode {
    const { message } = this.dynamicMsgModel.state;
    return (
      <>
        <div>
          msg: <span id="message">{message}</span>
        </div>
        <div id="link-hello2" onClick={this.onClickLink.bind(this, "/dynamic/hello2")}>
          /dynamic/hello2
        </div>
      </>
    );
  }
}

@Prerender({ routeComponent: DynamicRouteCtl })
export class DynamicStaticPathGenerator implements IJoyPrerender {
  // getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
  //   return "/dynamic/:id";
  // }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    // return [{params: {id: '1'}}, {params: {id: '2'}}];
    return ["/dynamic/hello1", "/dynamic/hello2"];
  }
}
