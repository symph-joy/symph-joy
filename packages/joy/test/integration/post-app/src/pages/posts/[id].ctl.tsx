import React, { ReactNode } from "react";
import { ReactBaseController, ReactController, Route, RouteParam } from "@symph/react";
import { ICoreContext, Autowire } from "@symph/core";
import { JoyPrerenderInterface, Prerender } from "@symph/joy/dist/build/prerender";
import { PostsModel } from "../../model/posts.model";

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
    return ["/dynamic/1", "/dynamic/2"];
  }
}

@Route({ path: "/posts/:id" })
@ReactController()
export default class DynamicRouteCtl extends ReactBaseController {
  @Autowire()
  private postsModel: PostsModel;

  async initialModelStaticState(): Promise<void> {
    // @ts-ignore
    const urlParams = this.props.match?.params;
    await this.postsModel.fetchEntity(urlParams.id);
    return;
  }

  async initialModelState(context: any): Promise<void> {
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
