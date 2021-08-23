// import { EXCEPTION_FILTERS_METADATA } from '@nestjs/common/constants';
// import { Controller } from '@nestjs/common/interfaces';
// import { ExceptionFilterMetadata } from '@nestjs/common/interfaces/exceptions';
// import { isEmpty } from '@nestjs/common/utils/shared.utils';
// import { ApplicationConfig } from '../application-config';
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { ComponentWrapper } from '../injector/instance-wrapper';
import { RouterProxyCallback } from "../router/router-proxy";
import { BaseExceptionFilterContext } from "./base-exception-filter-context";
import { ExternalExceptionsHandler } from "./external-exceptions-handler";
import { iterate } from "iterare";
import { ExceptionFilterMetadata } from "../interfaces/exceptions";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { Controller } from "../interfaces/controllers";
import { EXCEPTION_FILTERS_METADATA } from "../constants";
import { ComponentWrapper } from "@symph/core";
import { ServerContainer } from "../server-container";
import { ApplicationConfig } from "../application-config";
import { isEmpty } from "@symph/core/dist/utils/shared.utils";

export class ExternalExceptionFilterContext extends BaseExceptionFilterContext {
  constructor(container: ServerContainer, private readonly config?: ApplicationConfig) {
    super(container);
  }

  public create(
    instance: Controller,
    callback: RouterProxyCallback,
    // module: string,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): ExternalExceptionsHandler {
    // this.moduleContext = module;

    const exceptionHandler = new ExternalExceptionsHandler();
    const filters = this.createContext<ExceptionFilterMetadata[]>(
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

  public getGlobalMetadata<T extends any[]>(contextId = STATIC_CONTEXT, inquirerId?: string): T {
    if (!this.config) {
      return [] as any;
    }
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
