import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRoute } from "@symph/react";

import { Link } from "@symph/react/router-dom";

@ReactRoute({ path: "/links" })
@ReactController()
export default class LinksReactController extends BaseReactController {
  renderView(): ReactNode {
    return (
      <>
        <div>
          <Link id={"import-hello"} to={"/import-hello"}>
            /import-hello
          </Link>
        </div>
        <div>
          <Link id={"dynamic-route"} to={"/dynamic-route/1"}>
            /dynamic-route/1
          </Link>
        </div>
        <div>
          <Link id={"dynamic-module"} to={"/dynamic-module"}>
            /dynamic-module
          </Link>
        </div>
      </>
    );
  }
}
