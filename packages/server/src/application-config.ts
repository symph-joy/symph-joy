import { CanActivate } from "./interfaces/features/can-activate.interface";
import { NestInterceptor } from "./interfaces/features/nest-interceptor.interface";
import { ExceptionFilter } from "./interfaces/exceptions";
import { PipeTransform } from "./interfaces/features/pipe-transform.interface";
import { Component, ComponentWrapper } from "@symph/core";
import { WebSocketAdapter } from "./interfaces/websockets/web-socket-adapter.interface";
import { Value } from "@symph/config";

@Component()
export class ApplicationConfig {
  @Value({ default: "" })
  protected globalPrefix: string;

  private globalPipes: PipeTransform[] = [];
  private globalFilters: ExceptionFilter[] = [];
  private globalInterceptors: NestInterceptor[] = [];
  private globalGuards: CanActivate[] = [];
  private readonly globalRequestPipes: ComponentWrapper<PipeTransform>[] = [];
  private readonly globalRequestFilters: ComponentWrapper<ExceptionFilter>[] = [];
  private readonly globalRequestInterceptors: ComponentWrapper<NestInterceptor>[] = [];
  private readonly globalRequestGuards: ComponentWrapper<CanActivate>[] = [];
  private ioAdapter: WebSocketAdapter;

  // constructor(private ioAdapter: WebSocketAdapter | null = null) {}

  public setGlobalPrefix(prefix: string) {
    this.globalPrefix = prefix;
  }

  public getGlobalPrefix() {
    return this.globalPrefix;
  }

  public setIoAdapter(ioAdapter: WebSocketAdapter) {
    this.ioAdapter = ioAdapter;
  }

  public getIoAdapter(): WebSocketAdapter {
    // @ts-ignore
    return this.ioAdapter;
  }

  public addGlobalPipe(pipe: PipeTransform<any>) {
    this.globalPipes.push(pipe);
  }

  public useGlobalPipes(...pipes: PipeTransform<any>[]) {
    this.globalPipes = this.globalPipes.concat(pipes);
  }

  public getGlobalFilters(): ExceptionFilter[] {
    return this.globalFilters;
  }

  public addGlobalFilter(filter: ExceptionFilter) {
    this.globalFilters.push(filter);
  }

  public useGlobalFilters(...filters: ExceptionFilter[]) {
    this.globalFilters = this.globalFilters.concat(filters);
  }

  public getGlobalPipes(): PipeTransform<any>[] {
    return this.globalPipes;
  }

  public getGlobalInterceptors(): NestInterceptor[] {
    return this.globalInterceptors;
  }

  public addGlobalInterceptor(interceptor: NestInterceptor) {
    this.globalInterceptors.push(interceptor);
  }

  public useGlobalInterceptors(...interceptors: NestInterceptor[]) {
    this.globalInterceptors = this.globalInterceptors.concat(interceptors);
  }

  public getGlobalGuards(): CanActivate[] {
    return this.globalGuards;
  }

  public addGlobalGuard(guard: CanActivate) {
    this.globalGuards.push(guard);
  }

  public useGlobalGuards(...guards: CanActivate[]) {
    this.globalGuards = this.globalGuards.concat(guards);
  }

  public addGlobalRequestInterceptor(wrapper: ComponentWrapper<NestInterceptor>) {
    this.globalRequestInterceptors.push(wrapper);
  }

  public getGlobalRequestInterceptors(): ComponentWrapper<NestInterceptor>[] {
    return this.globalRequestInterceptors;
  }

  public addGlobalRequestPipe(wrapper: ComponentWrapper<PipeTransform>) {
    this.globalRequestPipes.push(wrapper);
  }

  public getGlobalRequestPipes(): ComponentWrapper<PipeTransform>[] {
    return this.globalRequestPipes;
  }

  public addGlobalRequestFilter(wrapper: ComponentWrapper<ExceptionFilter>) {
    this.globalRequestFilters.push(wrapper);
  }

  public getGlobalRequestFilters(): ComponentWrapper<ExceptionFilter>[] {
    return this.globalRequestFilters;
  }

  public addGlobalRequestGuard(wrapper: ComponentWrapper<CanActivate>) {
    this.globalRequestGuards.push(wrapper);
  }

  public getGlobalRequestGuards(): ComponentWrapper<CanActivate>[] {
    return this.globalRequestGuards;
  }
}
