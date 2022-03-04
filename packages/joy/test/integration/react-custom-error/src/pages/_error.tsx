import React from "react";
import { ErrorComponent } from "@symph/joy/react";

export default class MyError extends ErrorComponent {
  renderView({ statusCode, title }: { statusCode: string; title: string }) {
    return (
      <>
        <h1 id={"pageTitle"}>My Custom Error Page</h1>
        <p>
          <div id={"statusCode"}>{statusCode}</div>
          <div id={"title"}>{title}</div>
        </p>
      </>
    );
  }
}
