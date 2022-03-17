import React, { ReactNode } from "react";
import { BaseReactController, ReactController, ReactRouteContainer } from "@symph/react";

@ReactRouteContainer({ path: "/import-hello" })
@ReactController()
export class ImportHelloIndexPage extends BaseReactController {
  state = {
    msg: undefined,
  };

  sayHello = async () => {
    const HelloImport = (await import("./component/hello-import")).default;
    const helloImport = new HelloImport();
    const msg = helloImport.hello();
    this.setState({
      msg,
    });
  };

  renderView(): ReactNode {
    return (
      <>
        <button id={"btnSayHello"} onClick={this.sayHello}>
          say hello
        </button>
        <div id={"importHelloMsg"}>{this.state.msg}</div>
      </>
    );
  }
}
