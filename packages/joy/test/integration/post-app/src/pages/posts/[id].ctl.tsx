import React, { ReactNode } from "react";
import {
  Controller,
  IReactRouteStaticPathGenerator,
  ReactController,
  Route,
  ParsedUrlQuery,
  RouteParam,
} from "@symph/react";
import { IJoyContext, Inject, Injectable } from "@symph/core";
import {
  JoyPrerenderInterface,
  Prerender,
} from "@symph/joy/dist/build/prerender";
import { PostsModel } from "../../model/posts.model";

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
    return ["/dynamic/1", "/dynamic/2"];
  }
}

@Route<{ id: string }>({ path: "/posts/:id" })
@Controller()
export default class DynamicRouteCtl extends ReactController {
  @Inject()
  private postsModel: PostsModel;

  async initialModelStaticState(): Promise<void> {
    // @ts-ignore
    const urlParams = this.props.match?.params;
    console.log(">>>> post id initialModelStaticState", urlParams);
    await this.postsModel.fetchEntity(urlParams.id);
    return;
  }

  async initialModelState(context: any): Promise<void> {
    console.log(">>>> post id initialModelState");
    return;
  }

  @RouteParam()
  private id: string;

  renderView(): ReactNode {
    const { curEntity, isCurEntityLoading } = this.postsModel.state;

    if (isCurEntityLoading) {
      return "entity loading...";
    }
    return (
      <>
        <div>id: {curEntity.id}</div>
        <div>title: {curEntity.title}</div>
      </>
    );
  }
}
