import { createContext } from "react";
import { IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";

/**
 * `Joy` SSR context
 */
export interface JoySSRContextType {
  /**
   * Error object if encountered during rendering
   */
  err?: (Error & { statusCode?: number }) | null;
  /**
   * `HTTP` request object.
   */
  req?: IncomingMessage;
  /**
   * `HTTP` response object.
   */
  res?: ServerResponse;
  /**
   * Path section of `URL`.
   */
  pathname: string;
  /**
   * Query string section of `URL` parsed as an object.
   */
  query: ParsedUrlQuery;
  /**
   * `String` of the actual path including query.
   */
  asPath?: string;
  /**
   * `Component` the tree of the App to use if needing to render separately
   */
  // AppTree: AppTreeType;
}

export const JoySSRContext = createContext<JoySSRContextType | undefined>(undefined);
