// import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
// import { ExceptionsHandler } from '../../exceptions/exceptions-handler';
// import { ContextId } from '../../injector/instance-wrapper';

import { Controller } from "../../interfaces/controllers";
import { ContextId } from "@symph/core";
import { ExceptionsHandler } from "../../exceptions/exceptions-handler";

export interface ExceptionsFilter {
  create(
    instance: Controller,
    callback: Function,
    // module: string,
    contextId?: ContextId
    // inquirerId?: string,
  ): ExceptionsHandler;
}
