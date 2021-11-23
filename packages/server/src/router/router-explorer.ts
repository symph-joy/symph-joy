// import { HttpServer } from '@nestjs/common';
// import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
// import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
// import { InternalServerErrorException } from '@nestjs/common/exceptions';
// import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
// import { Type } from '@nestjs/common/interfaces/type.interface';
// import { Logger } from '@nestjs/common/services/logger.service';
// import {
//   addLeadingSlash,
//   isString,
//   isUndefined,
// } from '@nestjs/common/utils/shared.utils';
// import * as pathToRegexp from 'path-to-regexp';
// import { ApplicationConfig } from '../application-config';
// import { UnknownRequestMappingException } from '../errors/exceptions/unknown-request-mapping.exception';
// import { GuardsConsumer } from '../guards/guards-consumer';
// import { GuardsContextCreator } from '../guards/guards-context-creator';
// import { ContextIdFactory } from '../helpers/context-id-factory';
// import { ExecutionContextHost } from '../helpers/execution-context-host';
// import { ROUTE_MAPPED_MESSAGE } from '../helpers/messages';
// import { RouterMethodFactory } from '../helpers/router-method-factory';
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { Injector } from '../injector/injector';
// import { ContextId, ComponentWrapper } from '../injector/instance-wrapper';
// import { Module } from '../injector/module';
// import { InterceptorsConsumer } from '../interceptors/interceptors-consumer';
// import { InterceptorsContextCreator } from '../interceptors/interceptors-context-creator';
// import { MetadataScanner } from '../metadata-scanner';
// import { PipesConsumer } from '../pipes/pipes-consumer';
// import { PipesContextCreator } from '../pipes/pipes-context-creator';
// import { ExceptionsFilter } from './interfaces/exceptions-filter.interface';
// import { REQUEST_CONTEXT_ID } from './request/request-constants';
// import { RouteParamsFactory } from './route-params-factory';
// import { RouterExecutionContext } from './router-execution-context';
// import { RouterProxy, RouterProxyCallback } from './router-proxy';

import * as pathToRegexp from "path-to-regexp";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { ContextIdFactory } from "../helpers";
import { ContextId, Injector, ComponentWrapper, CoreContainer, Logger, Type } from "@symph/core";
import { GuardsContextCreator } from "../guards/guards-context-creator";
import { HttpServer } from "../interfaces/http";
import { GuardsConsumer } from "../guards/guards-consumer";
import { isString, isUndefined } from "@symph/core/dist/utils/shared.utils";
import { RouterProxy, RouterProxyCallback } from "./router-proxy";
import { ExceptionsFilter } from "./interfaces/exceptions-filter.interface";
import { RouterMethodFactory } from "../helpers/router-method-factory";
import { InterceptorsConsumer } from "../interceptors/interceptors-consumer";
import { InterceptorsContextCreator } from "../interceptors/interceptors-context-creator";
import { RouterExecutionContext } from "./router-execution-context";
import { PipesConsumer } from "../pipes/pipes-consumer";
import { Controller } from "../interfaces/controllers";
import { ExecutionContextHost } from "../helpers/execution-context-host";
import { RouteParamsFactory } from "./route-params-factory";
import { REQUEST_CONTEXT_ID } from "./request/request-constants";
import { PipesContextCreator } from "../pipes/pipes-context-creator";
import { ROUTE_MAPPED_MESSAGE } from "../helpers/messages";
import { InternalServerErrorException } from "../exceptions-common";
import * as Module from "module";
import { RequestMethod } from "../enums";
import { MetadataScanner } from "../metadata-scanner";
import { ApplicationConfig } from "../application-config";
import { METHOD_METADATA, PATH_METADATA } from "../constants";
import { UnknownRequestMappingException } from "../errors/exceptions/unknown-request-mapping.exception";
import { ServerContainer } from "../server-container";

export interface RoutePathProperties {
  path: string[];
  requestMethod: RequestMethod;
  targetCallback: RouterProxyCallback;
  methodName: string;
}

export const addLeadingSlash = (path?: string): string => (path ? (path.charAt(0) !== "/" ? "/" + path : path) : "");

export class RouterExplorer {
  private readonly executionContextCreator: RouterExecutionContext;
  private readonly routerMethodFactory = new RouterMethodFactory();
  private readonly logger = new Logger(RouterExplorer.name, true);
  private readonly exceptionFiltersCache = new WeakMap();

  constructor(
    private readonly metadataScanner: MetadataScanner,
    private readonly container: ServerContainer,
    private readonly injector?: Injector,
    private readonly routerProxy?: RouterProxy,
    private readonly exceptionsFilter?: ExceptionsFilter,
    config?: ApplicationConfig
  ) {
    this.executionContextCreator = new RouterExecutionContext(
      new RouteParamsFactory(),
      new PipesContextCreator(container, config),
      new PipesConsumer(),
      new GuardsContextCreator(container, config),
      new GuardsConsumer(),
      new InterceptorsContextCreator(container, config),
      new InterceptorsConsumer(),
      // @ts-ignore todo get HttpServer
      container.getHttpAdapterRef()
    );
  }

  public explore<T extends HttpServer = any>(
    instanceWrapper: ComponentWrapper,
    // module: string,
    applicationRef: T,
    basePath: string,
    host: string | string[]
  ) {
    const { instance } = instanceWrapper;
    const routerPaths = this.scanForPaths(instance);
    this.applyPathsToRouterProxy(
      applicationRef,
      routerPaths,
      instanceWrapper,
      // module,
      basePath,
      host
    );
  }

  public extractRouterPath(metatype: Type<Controller>, prefix = ""): string[] {
    let path = Reflect.getMetadata(PATH_METADATA, metatype);

    if (isUndefined(path)) {
      throw new UnknownRequestMappingException();
    }

    if (Array.isArray(path)) {
      path = path.map((p) => prefix + addLeadingSlash(p));
    } else {
      path = [prefix + addLeadingSlash(path)];
    }

    return path.map((p: any) => addLeadingSlash(p));
  }

  public scanForPaths(instance: Controller, prototype?: object): RoutePathProperties[] {
    const instancePrototype = isUndefined(prototype) ? Object.getPrototypeOf(instance) : prototype;

    return this.metadataScanner.scanFromPrototype<Controller, RoutePathProperties>(instance, instancePrototype, (method) =>
      this.exploreMethodMetadata(instance, instancePrototype, method)
    );
  }

  public exploreMethodMetadata(instance: Controller, prototype: object, methodName: string): RoutePathProperties {
    // @ts-ignore
    const instanceCallback = instance[methodName];
    // @ts-ignore
    const prototypeCallback = prototype[methodName];
    const routePath = Reflect.getMetadata(PATH_METADATA, prototypeCallback);
    if (isUndefined(routePath)) {
      // @ts-ignore
      return null;
    }
    const requestMethod: RequestMethod = Reflect.getMetadata(METHOD_METADATA, prototypeCallback);
    const path = isString(routePath) ? [addLeadingSlash(routePath)] : routePath.map((p: any) => addLeadingSlash(p));
    return {
      path,
      requestMethod,
      targetCallback: instanceCallback,
      methodName,
    };
  }

  public applyPathsToRouterProxy<T extends HttpServer>(
    router: T,
    routePaths: RoutePathProperties[],
    instanceWrapper: ComponentWrapper,
    // moduleKey: string,
    basePath: string,
    host: string | string[]
  ) {
    (routePaths || []).forEach((pathProperties) => {
      const { path, requestMethod } = pathProperties;
      this.applyCallbackToRouter(
        router,
        pathProperties,
        instanceWrapper,
        // moduleKey,
        basePath,
        host
      );
      path.forEach((item) => {
        const pathStr = this.stripEndSlash(basePath) + this.stripEndSlash(item);
        this.logger.log(ROUTE_MAPPED_MESSAGE(pathStr, requestMethod));
      });
    });
  }

  public stripEndSlash(str: string) {
    return str[str.length - 1] === "/" ? str.slice(0, str.length - 1) : str;
  }

  private applyCallbackToRouter<T extends HttpServer>(
    router: T,
    pathProperties: RoutePathProperties,
    instanceWrapper: ComponentWrapper,
    // moduleKey: string,
    basePath: string,
    host: string | string[]
  ) {
    const { path: paths, requestMethod, targetCallback, methodName } = pathProperties;
    const { instance } = instanceWrapper;
    const routerMethod = this.routerMethodFactory.get(router, requestMethod).bind(router);

    const isRequestScoped = !instanceWrapper.isDependencyTreeStatic();
    const proxy = isRequestScoped
      ? this.createRequestScopedHandler(
          instanceWrapper,
          requestMethod,
          // this.container.getModuleByKey(moduleKey),
          this.container,
          // moduleKey,
          methodName
        )
      : this.createCallbackProxy(
          instance,
          targetCallback,
          methodName,
          // moduleKey,
          requestMethod
        );

    const hostHandler = this.applyHostFilter(host, proxy);
    paths.forEach((path) => {
      const fullPath = this.stripEndSlash(basePath) + path;
      routerMethod(this.stripEndSlash(fullPath) || "/", hostHandler);
    });
  }

  private applyHostFilter(host: string | string[], handler: Function) {
    if (!host) {
      return handler;
    }

    const httpAdapterRef = this.container.getHttpAdapterRef();
    const hosts = Array.isArray(host) ? host : [host];
    const hostRegExps = hosts.map((host: string) => {
      const keys: any[] = [];
      // @ts-ignore
      const regexp = pathToRegexp(host, keys);
      return { regexp, keys };
    });

    const unsupportedFilteringErrorMessage = Array.isArray(host)
      ? `HTTP adapter does not support filtering on hosts: ["${host.join('", "')}"]`
      : `HTTP adapter does not support filtering on host: "${host}"`;

    return <TRequest extends Record<string, any> = any, TResponse = any>(req: TRequest, res: TResponse, next: () => void) => {
      (req as Record<string, any>).hosts = {};
      // @ts-ignore
      const hostname = httpAdapterRef.getRequestHostname(req) || "";

      for (const exp of hostRegExps) {
        const match = hostname.match(exp.regexp);
        if (match) {
          exp.keys.forEach((key, i) => (req.hosts[key.name] = match[i + 1]));
          return handler(req, res, next);
        }
      }
      if (!next) {
        throw new InternalServerErrorException(unsupportedFilteringErrorMessage);
      }
      return next();
    };
  }

  private createCallbackProxy(
    instance: Controller,
    callback: RouterProxyCallback,
    methodName: string,
    // moduleRef: string,
    requestMethod: RequestMethod,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ) {
    const executionContext = this.executionContextCreator.create(
      instance,
      callback,
      methodName,
      // moduleRef,
      requestMethod,
      contextId
      // inquirerId,
    );
    const exceptionFilter = this.exceptionsFilter!.create(
      instance,
      callback,
      // moduleRef,
      contextId
      // inquirerId,
    );
    // @ts-ignore
    return this.routerProxy!.createProxy(executionContext, exceptionFilter);
  }

  public createRequestScopedHandler(
    instanceWrapper: ComponentWrapper,
    requestMethod: RequestMethod,
    moduleRef: CoreContainer,
    // moduleKey: string,
    methodName: string
  ) {
    const { instance } = instanceWrapper;
    // const collection = moduleRef.controllers;
    return async <TRequest extends Record<any, any>, TResponse>(req: TRequest, res: TResponse, next: () => void) => {
      try {
        const contextId = this.getContextId(req);
        // const contextInstance = await this.injector.loadPerContext(
        //   instance,
        //   moduleRef,
        //   collection,
        //   contextId,
        // );
        const contextInstance = await this.injector?.loadInstance(instanceWrapper, contextId);
        await this.createCallbackProxy(
          contextInstance,
          contextInstance[methodName],
          methodName,
          // moduleKey,
          requestMethod,
          contextId
          // instanceWrapper.id,
        )(req, res, next);
      } catch (err) {
        let exceptionFilter = this.exceptionFiltersCache.get(instance[methodName]);
        if (!exceptionFilter) {
          exceptionFilter = this.exceptionsFilter!.create(
            instance,
            instance[methodName]
            // moduleKey,
          );
          this.exceptionFiltersCache.set(instance[methodName], exceptionFilter);
        }
        // @ts-ignore
        const host = new ExecutionContextHost([req, res, next]);
        exceptionFilter.next(err, host);
      }
    };
  }

  private getContextId<T extends Record<any, unknown> = any>(request: T): ContextId {
    const contextId = ContextIdFactory.getByRequest(request);
    if (!request[REQUEST_CONTEXT_ID as any]) {
      Object.defineProperty(request, REQUEST_CONTEXT_ID, {
        value: contextId,
        enumerable: false,
        writable: false,
        configurable: false,
      });
      this.container.registerRequestProvider(request, contextId);
    }
    return contextId;
  }
}
