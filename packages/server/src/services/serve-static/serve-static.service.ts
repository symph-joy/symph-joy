import { Injectable, ProviderLifecycle } from "@symph/core";
import { AbstractHttpAdapter } from "../../adapters";
import { ServeStaticModuleOptions } from "./interfaces/serve-static-options.interface";

@Injectable()
export class ServeStaticService implements ProviderLifecycle {
  constructor(
    httpAdapter: AbstractHttpAdapter,
    optionsArr: ServeStaticModuleOptions[]
  ) {}

  afterPropertiesSet(): Promise<void> | void {}
}
