// import { ExecutionContext } from '@nestjs/common';
// import { Type } from '@nestjs/common/interfaces';
// import {
//   ContextType,
//   HttpArgumentsHost,
//   RpcArgumentsHost,
//   WsArgumentsHost,
// } from '@nestjs/common/interfaces/features/arguments-host.interface';

import { ExecutionContext } from "../interfaces/features/execution-context.interface";
import {
  ContextType,
  HttpArgumentsHost,
  RpcArgumentsHost,
  WsArgumentsHost,
} from "../interfaces/features/arguments-host.interface";
import { Type } from "@symph/core";

export class ExecutionContextHost implements ExecutionContext {
  private contextType = "http";

  constructor(
    private readonly args: any[],
    private readonly constructorRef: Type<any>,
    private readonly handler: Function
  ) {}

  setType<TContext extends string = ContextType>(type: TContext) {
    type && (this.contextType = type);
  }

  getType<TContext extends string = ContextType>(): TContext {
    return this.contextType as TContext;
  }

  getClass<T = any>(): Type<T> {
    return this.constructorRef;
  }

  getHandler(): Function {
    return this.handler;
  }

  getArgs<T extends Array<any> = any[]>(): T {
    return this.args as T;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index] as T;
  }

  switchToRpc(): RpcArgumentsHost {
    return Object.assign(this, {
      getData: () => this.getArgByIndex(0),
      getContext: () => this.getArgByIndex(1),
    });
  }

  switchToHttp(): HttpArgumentsHost {
    return Object.assign(this, {
      getRequest: () => this.getArgByIndex(0),
      getResponse: () => this.getArgByIndex(1),
      getNext: () => this.getArgByIndex(2),
    });
  }

  switchToWs(): WsArgumentsHost {
    return Object.assign(this, {
      getClient: () => this.getArgByIndex(0),
      getData: () => this.getArgByIndex(1),
    });
  }
}
