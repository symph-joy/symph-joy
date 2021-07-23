// import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
// import { Controller, NestInterceptor } from '@nestjs/common/interfaces';
// import { isEmpty, isFunction } from '@nestjs/common/utils/shared.utils';
import { iterate } from "iterare";
import { ApplicationConfig } from "../application-config";
import { ContextCreator } from "../helpers/context-creator";
import { InstanceWrapper, Type } from "@symph/core";
import { NestInterceptor } from "../interfaces/features/nest-interceptor.interface";
import { isEmpty, isFunction } from "@symph/core/dist/utils/shared.utils";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { Controller } from "../interfaces/controllers";
import { ServerContainer } from "../server-container";
import { INTERCEPTORS_METADATA } from "../constants";
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { InstanceWrapper } from '../injector/instance-wrapper';

export class InterceptorsContextCreator extends ContextCreator {
  // private moduleContext: string;

  constructor(
    private readonly container: ServerContainer,
    private readonly config?: ApplicationConfig
  ) {
    super();
  }

  public create(
    instance: Controller,
    callback: (...args: unknown[]) => unknown,
    // module: string,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): NestInterceptor[] {
    // this.moduleContext = module;
    return this.createContext(
      instance,
      callback,
      INTERCEPTORS_METADATA,
      contextId
      // inquirerId,
    );
  }

  public createConcreteContext<T extends any[], R extends any[]>(
    metadata: T,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): R {
    if (isEmpty(metadata)) {
      return [] as any;
    }
    return iterate(metadata)
      .filter(
        (interceptor) =>
          interceptor && (interceptor.name || interceptor.intercept)
      )
      .map((interceptor) => this.getInterceptorInstance(interceptor, contextId))
      .filter(
        (interceptor) =>
          (interceptor && isFunction(interceptor.intercept)) as boolean
      )
      .toArray() as R;
  }

  public getInterceptorInstance(
    interceptor: Type | NestInterceptor,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): NestInterceptor | null {
    const isObject = (interceptor as NestInterceptor).intercept;
    if (!!isObject) {
      return interceptor as NestInterceptor;
    }
    const instanceWrapper = this.getInstanceByMetatype(interceptor as Type);
    if (!instanceWrapper) {
      throw new Error(
        `could not find out interceptor(class:${
          (interceptor as Type<any>).name
        }) in the current context`
      );
      // return null;
    }
    const instanceHost = instanceWrapper.getInstanceByContextId(
      contextId
      // inquirerId,
    );
    return instanceHost && instanceHost.instance;
  }

  public getInstanceByMetatype<T extends Type>(
    metatype: T
  ): InstanceWrapper | undefined {
    return this.container.getProviderByType(metatype);

    // if (!this.moduleContext) {
    //   return;
    // }
    // const collection = this.container.getModules();
    // const moduleRef = collection.get(this.moduleContext);
    // if (!moduleRef) {
    //   return;
    // }
    // return moduleRef.injectables.get(metatype.name as string);
  }

  public getGlobalMetadata<T extends unknown[]>(
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): T {
    if (!this.config) {
      return [] as any;
    }
    const globalInterceptors = this.config.getGlobalInterceptors() as T;
    // if (contextId === STATIC_CONTEXT && !inquirerId) {
    if (contextId === STATIC_CONTEXT) {
      return globalInterceptors;
    }
    const scopedInterceptorWrappers = this.config.getGlobalRequestInterceptors() as InstanceWrapper[];
    const scopedInterceptors = iterate(scopedInterceptorWrappers)
      .map((wrapper) => wrapper.getInstanceByContextId(contextId))
      .filter((host) => !!host)
      .map((host) => host.instance)
      .toArray();

    return globalInterceptors.concat(scopedInterceptors) as T;
  }
}
