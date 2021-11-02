// eslint typescript has a bug with TS enums
/* eslint-disable no-shadow */
export enum TARGET {
  CONSOLE = "CONSOLE",
  ZIPKIN = "ZIPKIN",
  JAEGER = "JAEGER",
  TELEMETRY = "TELEMETRY",
}

export type SpanId = string;

export const traceGlobals: Map<any, any> = new Map();
export const setGlobal = (key: any, val: any) => {
  traceGlobals.set(key, val);
};
