import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";
import { HelloModel } from "../model/hello-model";
import { Inject, IApplicationContext } from "@symph/core";
import { IJoyPrerender, Prerender, TJoyPrerenderApi } from "@symph/joy";

@ReactRoute({ path: "/with-api" })
@ReactController()
export default class WithApiController extends BaseReactController {
  @Inject()
  private helloModel: HelloModel;

  fetchMsg = async () => {
    await this.helloModel.fetchMessage();
  };

  renderView(): ReactNode {
    const { message } = this.helloModel.state;
    return (
      <div>
        <button id={"btnFetchMsg"} onClick={this.fetchMsg}>
          fetchMsg
        </button>
        <div id="msg">{message}</div>
      </div>
    );
  }
}

@Prerender({ routeComponent: WithApiController })
export class EntityPrerenderGenerator implements IJoyPrerender {
  getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
    return "/with-api";
  }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    return ["/with-api"];
  }

  async getApis?(): Promise<Array<TJoyPrerenderApi>> {
    return [
      {
        path: "/hello",
      },
    ];
  }
}
