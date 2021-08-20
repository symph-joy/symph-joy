import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteParam } from "@symph/react";
import { ICoreContext } from "@symph/core";
import { JoyPrerenderInterface, Prerender } from "@symph/joy/dist/build/prerender";

@Prerender()
export class DynamicStaticPathGenerator implements JoyPrerenderInterface {
  getRoute(): string | ReactBaseController<Record<string, unknown>, Record<string, unknown>, ICoreContext> {
    return "/dynamic/:id";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string | { params: { id: string } }>> {
    // return [{params: {id: '1'}}, {params: {id: '2'}}];
    return ["/dynamic/hello1", "/dynamic/hello2"];
  }
}

@Route({ path: "/dynamic/:msg" })
@ReactController()
export default class DynamicRouteCtl extends ReactBaseController {
  initialModelStaticState(urlParams: any): Promise<void> {
    return;
  }

  initialModelState(context: any): Promise<void> {
    return;
  }

  @RouteParam()
  private msg: string;

  renderView(): ReactNode {
    return (
      <>
        <div>
          msg: <span id="msg">{this.msg}</span>
        </div>
      </>
    );
  }
}
