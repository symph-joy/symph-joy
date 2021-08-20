// import { Component } from '@nestjs/common';
// import { AbstractHttpAdapter } from '@nestjs/core';
import { join } from "path";
import { ServeStaticOptions } from "../interfaces/serve-static-options.interface";
import { Component } from "@symph/core";
import { AbstractHttpAdapter } from "../../../adapters";

@Component()
export abstract class AbstractLoader {
  public abstract register(httpAdapter: AbstractHttpAdapter, options: ServeStaticOptions[]): void;

  public getIndexFilePath(clientPath: string): string {
    return join(clientPath, "index.html");
  }
}
