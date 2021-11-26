import React, { Component } from "react";

export class TestClass extends Component<any, any> {
  public publicProp: string;

  constructor(private privateProp: string) {
    super(privateProp);
  }

  render() {
    return <div>Hello</div>;
  }
}
