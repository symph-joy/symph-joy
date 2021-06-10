// import { CanActivate } from '@nestjs/common';
// import { ContextType, Controller } from '@nestjs/common/interfaces';
// import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { Observable } from "rxjs";
import { ExecutionContextHost } from "../helpers/execution-context-host";
import { Controller } from "../interfaces/controllers";
import { CanActivate } from "../interfaces/features/can-activate.interface";
import { isEmpty } from "@symph/core/dist/utils/shared.utils";
import { ContextType } from "../interfaces/features/arguments-host.interface";

export class GuardsConsumer {
  public async tryActivate<TContext extends string = ContextType>(
    guards: CanActivate[],
    args: unknown[],
    instance: Controller,
    callback: (...args: unknown[]) => unknown,
    type?: TContext
  ): Promise<boolean> {
    if (!guards || isEmpty(guards)) {
      return true;
    }
    const context = this.createContext(args, instance, callback);
    // @ts-ignore
    context.setType<TContext>(type);

    for (const guard of guards) {
      const result = guard.canActivate(context);
      if (await this.pickResult(result)) {
        continue;
      }
      return false;
    }
    return true;
  }

  public createContext(
    args: unknown[],
    instance: Controller,
    callback: (...args: unknown[]) => unknown
  ): ExecutionContextHost {
    return new ExecutionContextHost(
      args,
      instance.constructor as any,
      callback
    );
  }

  public async pickResult(
    result: boolean | Promise<boolean> | Observable<boolean>
  ): Promise<boolean> {
    if (result instanceof Observable) {
      return result.toPromise();
    }
    return result;
  }
}
