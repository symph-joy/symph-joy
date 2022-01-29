import React from "react";
import { ErrorComponent } from "@symph/joy/react";

export default class MyError extends ErrorComponent {
  render() {
    const err = this.getErrorObject();
    console.log(">>> MyError, err:", err);
    const { statusCode, title } = err;
    return (
      <div>
        <div id={"pageTitle"}>Custom Error</div>
        <div id={"statusCode"}>{statusCode}</div>
        <div id={"title"}>{title}</div>
      </div>
    );
  }
}
