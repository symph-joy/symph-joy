// import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';

import { HttpException } from "../exceptions-common";
import { ArgumentsHost } from "../interfaces/features/arguments-host.interface";
import { Logger } from "@symph/core";

export class ExternalExceptionFilter<T = any, R = any> {
  private static readonly logger = new Logger("ExceptionsHandler");

  catch(exception: T, host: ArgumentsHost): R | Promise<R> {
    if (exception instanceof Error && !(exception instanceof HttpException)) {
      ExternalExceptionFilter.logger.error(exception.message, exception.stack);
    }
    throw exception;
  }
}
