import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { ReactApplicationContext } from "@symph/react";

export interface JoyHooks {
  onBeforeRender?({
    appContext,
    req,
    res,
    pathname,
    query,
  }: {
    appContext: ReactApplicationContext;
    req: IncomingMessage;
    res: ServerResponse;
    pathname: string;
    query: ParsedUrlQuery;
  }): Promise<void> | void;
}
