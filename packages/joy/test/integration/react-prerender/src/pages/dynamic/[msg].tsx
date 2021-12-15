import React, { ReactNode } from "react";
import { BaseReactController, ReactController, Route, RouteParam } from "@symph/react";
import { IApplicationContext } from "@symph/core";
import { IJoyPrerender, Prerender } from "@symph/joy/react";

@Prerender()
export class DynamicStaticPathGenerator implements IJoyPrerender {
  getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
    return "/dynamic/:id";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    // return [{params: {id: '1'}}, {params: {id: '2'}}];
    return ["/dynamic/hello1", "/dynamic/hello2"];
  }
}

@Route({ path: "/dynamic/:msg" })
@ReactController()
export default class DynamicRouteCtl extends BaseReactController {
  initialModelStaticState(urlParams: any): Promise<void> {
    return;
  }

  initialModelState(context: any): Promise<void> {
    return;
  }

  @RouteParam()
  private msg: string;

  onClickLink = (link: string) => {
    // @ts-ignore
    this.props.history.push(link);
  };

  renderView(): ReactNode {
    return (
      <>
        <div>
          msg: <span id="msg">{this.msg}</span>
        </div>
        <div id="link-hello2" onClick={this.onClickLink.bind(this, "/dynamic/hello2")}>
          /dynamic/hello2
        </div>
      </>
    );
  }
}
