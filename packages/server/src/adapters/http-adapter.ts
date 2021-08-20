// import { HttpServer, RequestMethod } from '@nestjs/common';
// import { RequestHandler } from '@nestjs/common/interfaces';
// import {
//   CorsOptions,
//   CorsOptionsDelegate,
// } from '@nestjs/common/interfaces/external/cors-options.interface';
// import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';

import { HttpServer, RequestHandler } from "../interfaces/http";
import { NestApplicationOptions } from "../interfaces/nest-application-options.interface";
import { CorsOptions, CorsOptionsDelegate } from "../interfaces/external/cors-options.interface";
import { RequestMethod } from "../enums";

/**
 * @publicApi
 */
export abstract class AbstractHttpAdapter<TServer = any, TRequest = any, TResponse = any> implements HttpServer<TRequest, TResponse> {
  protected httpServer: TServer;

  constructor(protected readonly instance: any) {}
  all(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  all(handler: RequestHandler<TRequest, TResponse>): any;
  all(path: any, handler?: any) {
    throw new Error("Method not implemented.");
  }
  setBaseViewsDir?(path: string | string[]): this {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async init() {}

  public use(...args: any[]) {
    return this.instance.use(...args);
  }

  public get(handler: RequestHandler): any;
  public get(path: any, handler: RequestHandler): any;
  public get(...args: any[]) {
    return this.instance.get(...args);
  }

  public post(handler: RequestHandler): any;
  public post(path: any, handler: RequestHandler): any;
  public post(...args: any[]) {
    return this.instance.post(...args);
  }

  public head(handler: RequestHandler): any;
  public head(path: any, handler: RequestHandler): any;
  public head(...args: any[]) {
    return this.instance.head(...args);
  }

  public delete(handler: RequestHandler): any;
  public delete(path: any, handler: RequestHandler): any;
  public delete(...args: any[]) {
    return this.instance.delete(...args);
  }

  public put(handler: RequestHandler): any;
  public put(path: any, handler: RequestHandler): any;
  public put(...args: any[]) {
    return this.instance.put(...args);
  }

  public patch(handler: RequestHandler): any;
  public patch(path: any, handler: RequestHandler): any;
  public patch(...args: any[]) {
    return this.instance.patch(...args);
  }

  public options(handler: RequestHandler): any;
  public options(path: any, handler: RequestHandler): any;
  public options(...args: any[]) {
    return this.instance.options(...args);
  }

  public listen(port: string | number, callback?: () => void): any;
  public listen(port: string | number, hostname: string, callback?: () => void): any;
  public listen(port: any, hostname?: any, callback?: any) {
    return this.instance.listen(port, hostname, callback);
  }

  public getHttpServer(): TServer {
    return this.httpServer as TServer;
  }

  public setHttpServer(httpServer: TServer) {
    this.httpServer = httpServer;
  }

  public getInstance<T = any>(): T {
    return this.instance as T;
  }

  abstract close(): any;
  abstract initHttpServer(): any;
  abstract useStaticAssets(...args: any[]): any;
  abstract setViewEngine(engine: string): any;
  abstract getRequestHostname(request: TRequest): any;
  abstract getRequestMethod(request: TRequest): any;
  abstract getRequestUrl(request: TRequest): any;
  abstract status(response: any, statusCode: number): any;
  abstract reply(response: any, body: any, statusCode?: number): any;
  abstract render(response: any, view: string, options: any): any;
  abstract redirect(response: any, statusCode: number, url: string): any;
  abstract setErrorHandler(handler: Function, prefix?: string): any;
  abstract setNotFoundHandler(handler: Function, prefix?: string): any;
  abstract setHeader(response: any, name: string, value: string): any;
  abstract registerParserMiddleware(prefix?: string): any;
  abstract enableCors(options: CorsOptions | CorsOptionsDelegate<TRequest>, prefix?: string): any;
  abstract createMiddlewareFactory(requestMethod: RequestMethod): ((path: string, callback: Function) => any) | Promise<(path: string, callback: Function) => any>;
  abstract getType(): string;
}
