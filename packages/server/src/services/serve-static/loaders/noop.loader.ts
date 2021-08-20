/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ServeStaticOptions } from "../interfaces/serve-static-options.interface";
import { AbstractLoader } from "./abstract.loader";
import { Component } from "@symph/core";
import { AbstractHttpAdapter } from "../../../adapters";

@Component()
export class NoopLoader extends AbstractLoader {
  public register(httpAdapter: AbstractHttpAdapter, options: ServeStaticOptions[]) {}
}
