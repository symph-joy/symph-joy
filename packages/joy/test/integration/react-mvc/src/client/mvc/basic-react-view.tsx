import React, { Component, ReactNode } from "react";

export class BasicReactView extends Component<{ message: string; count: number }, any> {
  render(): ReactNode {
    const { message, count } = this.props;
    return (
      <>
        <div>
          message: <span id="message">{message}</span>
        </div>
        <div>
          count: <span id="count">{count}</span>
        </div>
      </>
    );
  }
}
