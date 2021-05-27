import React, { ReactNode } from "react";
import {
  Controller,
  IReactRouteStaticPathGenerator,
  ReactController,
  Route,
  ParsedUrlQuery,
  RouteParam,
} from "@symph/react";
import { IJoyContext, Injectable } from "@symph/core";
import {
  JoyPrerenderInterface,
  Prerender,
} from "@symph/joy/dist/build/prerender";

@Prerender()
export class DynamicStaticPathGenerator implements JoyPrerenderInterface {
  getRoute():
    | string
    | ReactController<
        Record<string, unknown>,
        Record<string, unknown>,
        IJoyContext
      > {
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

@Route<{ id: string }>({ path: "/dynamic/:msg" })
@Controller()
export default class DynamicRouteCtl extends ReactController {
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
