import React from "react";
import { ErrorComponent } from "@symph/joy/react";

export default class MyError extends ErrorComponent {
  renderView({ statusCode, title }: { statusCode: string; title: string }) {
    return (
      <>
        <h1>My Custom Error Page</h1>
        <p>
          {statusCode}|{title}
        </p>
      </>
    );
  }
}
