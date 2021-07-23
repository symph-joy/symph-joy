// import { PIPES_METADATA } from '@nestjs/common/constants';
// import { Controller, PipeTransform } from '@nestjs/common/interfaces';
// import { isEmpty, isFunction } from '@nestjs/common/utils/shared.utils';
import { InstanceWrapper, Type } from "@symph/core";
import { iterate } from "iterare";
import { ApplicationConfig } from "../application-config";
import { ContextCreator } from "../helpers/context-creator";
// import { STATIC_CONTEXT } from '../injector/constants';
// import { NestContainer } from '../injector/container';
// import { InstanceWrapper } from '../injector/instance-wrapper';
import { ServerContainer } from "../server-container";
import { isEmpty, isFunction } from "@symph/core/dist/utils/shared.utils";
import { STATIC_CONTEXT } from "@symph/core/dist/injector/constants";
import { PipeTransform } from "../interfaces/features/pipe-transform.interface";
import { Controller } from "../interfaces/controllers";
import { PIPES_METADATA } from "../constants";
import { UnknownElementException } from "@symph/core/dist/errors/exceptions/unknown-element.exception";

export class PipesContextCreator extends ContextCreator {
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
    // moduleKey: string,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): PipeTransform[] {
    // this.moduleContext = moduleKey;
    return this.createContext(
      instance,
      callback,
      PIPES_METADATA,
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
      .filter((pipe: any) => pipe && (pipe.name || pipe.transform))
      .map((pipe) => this.getPipeInstance(pipe, contextId))
      .filter(
        (pipe) => !!(pipe && pipe.transform && isFunction(pipe.transform))
      )
      .toArray() as R;
  }

  public getPipeInstance(
    pipe: Function | PipeTransform,
    contextId = STATIC_CONTEXT
    // inquirerId?: string,
  ): PipeTransform | null {
    const isObject = (pipe as PipeTransform).transform;
    if (!!isObject) {
      return pipe as PipeTransform;
    }
    // const instanceWrapper = this.getInstanceByMetatype(pipe as Type<any>);
    const instanceWrapper = this.container.getProviderByType(pipe as Type<any>);
    if (!instanceWrapper) {
      throw new Error(
        `could not find out pipe(class:${
          (pipe as Type<any>).name
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
    // return moduleRef.injectables.get(metatype.name);
  }

  public getGlobalMetadata<T extends unknown[]>(
    contextId = STATIC_CONTEXT,
    inquirerId?: string
  ): T {
    if (!this.config) {
      return [] as any;
    }
    const globalPipes = this.config.getGlobalPipes() as T;
    if (contextId === STATIC_CONTEXT && !inquirerId) {
      return globalPipes;
    }
    const scopedPipeWrappers = this.config.getGlobalRequestPipes() as InstanceWrapper[];
    const scopedPipes = iterate(scopedPipeWrappers)
      .map((wrapper) => wrapper.getInstanceByContextId(contextId))
      .filter((host) => !!host)
      .map((host) => host.instance)
      .toArray();

    return globalPipes.concat(scopedPipes) as T;
  }

  public setModuleContext(context: string) {
    // this.moduleContext = context;
  }
}
