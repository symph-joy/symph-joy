/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ServeStaticModuleOptions } from "../interfaces/serve-static-options.interface";
import { AbstractLoader } from "./abstract.loader";
import { Injectable } from "@symph/core";
import { AbstractHttpAdapter } from "../../../adapters";

@Injectable()
export class NoopLoader extends AbstractLoader {
  public register(
    httpAdapter: AbstractHttpAdapter,
    options: ServeStaticModuleOptions[]
  ) {}
}
