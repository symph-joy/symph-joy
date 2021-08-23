// import { HttpServer } from '@nestjs/common';
// import { EXCEPTION_FILTERS_METADATA } from '@nestjs/common/constants';
// import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
// import { isEmpty } from '@nestjs/common/utils/shared.utils';
// import { ApplicationConfig } from '../application-config';
// import { BaseExceptionFilterContext } from '../exceptions/base-exception-filter-context';
// import { ExceptionsHandler } from '../exceptions/exceptions-handler';
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { ComponentWrapper } from '../injector/instance-wrapper';
// import { RouterProxyCallback } from './router-proxy';
// import { iterate } from 'iterare';

import { ComponentWrapper } from "@symph/core";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { BaseExceptionFilterContext } from "../exceptions/base-exception-filter-context";
import { HttpServer } from "../interfaces/http";
import { ExceptionsHandler } from "../exceptions/exceptions-handler";
import { Controller } from "../interfaces/controllers";
import { RouterProxyCallback } from "./router-proxy";
import { iterate } from "iterare";
import { ApplicationConfig } from "../application-config";
import { EXCEPTION_FILTERS_METADATA } from "../constants";
import { isEmpty } from "@symph/core/dist/utils/shared.utils";
import { ServerContainer } from "../server-container";

export class RouterExceptionFilters extends BaseExceptionFilterContext {
  constructor(container: ServerContainer, private readonly config: ApplicationConfig, private readonly applicationRef: HttpServer) {
    super(container);
  }

  public create(
    instance: Controller,
    callback: RouterProxyCallback,
    // moduleKey: string,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): ExceptionsHandler {
    // this.moduleContext = moduleKey;

    const exceptionHandler = new ExceptionsHandler(this.applicationRef);
    const filters = this.createContext(
      instance,
      callback,
      EXCEPTION_FILTERS_METADATA,
      contextId
      // inquirerId,
    );
    if (isEmpty(filters)) {
      return exceptionHandler;
    }
    exceptionHandler.setCustomFilters(filters.reverse());
    return exceptionHandler;
  }

  public getGlobalMetadata<T extends unknown[]>(contextId = STATIC_CONTEXT, inquirerId?: string): T {
    const globalFilters = this.config.getGlobalFilters() as T;
    if (contextId === STATIC_CONTEXT && !inquirerId) {
      return globalFilters;
    }
    const scopedFilterWrappers = this.config.getGlobalRequestFilters() as ComponentWrapper[];
    const scopedFilters = iterate(scopedFilterWrappers)
      // .map(wrapper => wrapper.getInstanceByContextId(contextId, inquirerId))
      .map((wrapper) => wrapper.getInstanceByContextId(contextId))
      .filter((host) => !!host)
      .map((host) => host.instance)
      .toArray();

    return globalFilters.concat(scopedFilters) as T;
  }
}
