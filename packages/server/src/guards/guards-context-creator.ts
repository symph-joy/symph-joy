// import { CanActivate } from '@nestjs/common';
// import { GUARDS_METADATA } from '@nestjs/common/constants';
// import { Controller } from '@nestjs/common/interfaces';
// import { isEmpty, isFunction } from '@nestjs/common/utils/shared.utils';
import { iterate } from "iterare";
import { ApplicationConfig } from "../application-config";
import { ContextCreator } from "../helpers/context-creator";
import { InstanceWrapper, Type } from "@symph/core";
import { isEmpty, isFunction } from "@symph/core/dist/utils/shared.utils";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { Controller } from "../interfaces/controllers";
import { CanActivate } from "../interfaces/features/can-activate.interface";
import { ServerContainer } from "../server-container";
import { GUARDS_METADATA } from "../constants";
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { InstanceWrapper } from '../injector/instance-wrapper';

export class GuardsContextCreator extends ContextCreator {
  private moduleContext: string;

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
  ): CanActivate[] {
    // this.moduleContext = module;
    return this.createContext(
      instance,
      callback,
      GUARDS_METADATA,
      contextId
      // inquirerId,
    );
  }

  public createConcreteContext<T extends unknown[], R extends unknown[]>(
    metadata: T,
    contextId = STATIC_CONTEXT,
    inquirerId?: string
  ): R {
    if (isEmpty(metadata)) {
      return [] as any;
    }
    return iterate(metadata)
      .filter((guard: any) => guard && (guard.name || guard.canActivate))
      .map((guard) => this.getGuardInstance(guard as Type, contextId))
      .filter((guard) => (guard && isFunction(guard.canActivate)) as boolean)
      .toArray() as R;
  }

  public getGuardInstance(
    guard: Type<any> | CanActivate,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): CanActivate | null {
    const isObject = guard && (guard as CanActivate).canActivate;
    if (!!isObject) {
      return guard as CanActivate;
    }
    const instanceWrapper = this.getInstanceByMetatype(guard as Type);
    if (!instanceWrapper) {
      throw new Error(
        `could not find out guard(class:${
          (guard as Type<any>).name
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

  public getInstanceByMetatype<T extends Type<any>>(
    guard: T
  ): InstanceWrapper | undefined {
    return this.container.getProvidersByType(guard);

    // if (!this.moduleContext) {
    //   return;
    // }
    // // const collection = this.container.getModules();
    // const moduleRef = collection.get(this.moduleContext);
    // if (!moduleRef) {
    //   return;
    // }
    // const injectables = moduleRef.injectables;
    // return injectables.get(guard.name as string);
  }

  public getGlobalMetadata<T extends unknown[]>(
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): T {
    if (!this.config) {
      return [] as any;
    }
    const globalGuards = this.config.getGlobalGuards() as T;
    // if (contextId === STATIC_CONTEXT && !inquirerId) {
    if (contextId === STATIC_CONTEXT) {
      return globalGuards;
    }
    const scopedGuardWrappers = this.config.getGlobalRequestGuards() as InstanceWrapper[];
    const scopedGuards = iterate(scopedGuardWrappers)
      .map((wrapper) => wrapper.getInstanceByContextId(contextId))
      .filter((host) => !!host)
      .map((host) => host.instance)
      .toArray();

    return globalGuards.concat(scopedGuards) as T;
  }
}
