import React, { Component, ReactNode } from "react";
import { Controller, ReactController, Route } from "@symph/react";
import { HelloModel } from "../models/HelloModel";
import { string } from "prop-types";
import { Inject } from "@symph/core";

@Route({ path: "/hello" })
@Controller()
export default class HelloController extends ReactController {
  // static async getStaticPaths(): Promise<any> {
  //   return {
  //     paths: ['/hello/1', '/hello/2'],
  //     fallback: true
  //   }
  // }
  //
  // static async getStaticState(params: any): Promise<{bbb: string}>  {
  //   return {bbb:'111'}
  // }

  // async buildPreRenderPaths(): Promise<any> {
  //   return {
  //     paths: [{params: {id: 1}}, {params: {id: 2}}],
  //     fallback: true
  //   }
  // }

  // async getInitialStaticModelState(): Promise<Record<string, any>> {
  //   return  {}
  // }
  //
  // async getInitialModelState({applicationContext, request, response}: any): Promise<void> {
  // }

  @Inject(HelloModel)
  private helloModel: HelloModel;

  renderView(): ReactNode {
    const { status, count } = this.helloModel.state;
    return (
      <div>
        <h1>Hello-1</h1>
        <div data-testid="status">dmessage: {status}</div>
        <div data-testid="count">total count: {count}</div>
        <button onClick={() => this.helloModel.add(1)}>add 1</button>
      </div>
    );
  }
}
