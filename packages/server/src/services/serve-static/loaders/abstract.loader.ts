// import { Injectable } from '@nestjs/common';
// import { AbstractHttpAdapter } from '@nestjs/core';
import { join } from "path";
import { ServeStaticModuleOptions } from "../interfaces/serve-static-options.interface";
import { Injectable } from "@symph/core";
import { AbstractHttpAdapter } from "../../../adapters";

@Injectable()
export abstract class AbstractLoader {
  public abstract register(
    httpAdapter: AbstractHttpAdapter,
    options: ServeStaticModuleOptions[]
  ): void;

  public getIndexFilePath(clientPath: string): string {
    return join(clientPath, "index.html");
  }
}
