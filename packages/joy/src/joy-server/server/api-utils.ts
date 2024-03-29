import { IncomingMessage, ServerResponse } from "http";
import { parse } from "content-type";
import { CookieSerializeOptions } from "cookie";
import generateETag from "etag";
import fresh from "fresh";
import getRawBody from "raw-body";
import { Stream } from "stream";
import { JoyApiRequest, JoyApiResponse } from "../lib/utils";
import { decryptWithSecret, encryptWithSecret } from "./crypto-utils";
import { Params } from "./router";

export type JoyApiRequestCookies = { [key: string]: string };
export type JoyApiRequestQuery = { [key: string]: string | string[] };

export type __ApiPreviewProps = {
  previewModeId: string;
  previewModeEncryptionKey: string;
  previewModeSigningKey: string;
};

// export async function apiResolver(
//   req: IncomingMessage,
//   res: ServerResponse,
//   query: any,
//   resolverModule: any,
//   apiContext: __ApiPreviewProps,
//   propagateError: boolean,
//   onError?: ({ err }: { err: any }) => Promise<void>
// ) {
//   const apiReq = req as JoyApiRequest
//   const apiRes = res as JoyApiResponse
//
//   try {
//     if (!resolverModule) {
//       res.statusCode = 404
//       res.end('Not Found')
//       return
//     }
//     const config: PageConfig = resolverModule.config || {}
//     const bodyParser = config.api?.bodyParser !== false
//     const externalResolver = config.api?.externalResolver || false
//
//     // Parsing of cookies
//     setLazyProp({ req: apiReq }, 'cookies', getCookieParser(req))
//     // Parsing query string
//     apiReq.query = query
//     // Parsing preview data
//     setLazyProp({ req: apiReq }, 'previewData', () =>
//       tryGetPreviewData(req, res, apiContext)
//     )
//     // Checking if preview mode is enabled
//     setLazyProp({ req: apiReq }, 'preview', () =>
//       apiReq.previewData !== false ? true : undefined
//     )
//
//     // Parsing of body
//     if (bodyParser) {
//       apiReq.body = await parseBody(
//         apiReq,
//         config.api && config.api.bodyParser && config.api.bodyParser.sizeLimit
//           ? config.api.bodyParser.sizeLimit
//           : '1mb'
//       )
//     }
//
//     apiRes.status = (statusCode) => sendStatusCode(apiRes, statusCode)
//     apiRes.send = (data) => sendData(apiReq, apiRes, data)
//     apiRes.json = (data) => sendJson(apiRes, data)
//     apiRes.redirect = (statusOrUrl: number | string, url?: string) =>
//       redirect(apiRes, statusOrUrl, url)
//     apiRes.setPreviewData = (data, options = {}) =>
//       setPreviewData(apiRes, data, Object.assign({}, apiContext, options))
//     apiRes.clearPreviewData = () => clearPreviewData(apiRes)
//
//     const resolver = interopDefault(resolverModule)
//     let wasPiped = false
//
//     if (process.env.NODE_ENV !== 'production') {
//       // listen for pipe event and don't show resolve warning
//       res.once('pipe', () => (wasPiped = true))
//     }
//
//     // Call API route method
//     await resolver(req, res)
//
//     if (
//       process.env.NODE_ENV !== 'production' &&
//       !externalResolver &&
//       !isResSent(res) &&
//       !wasPiped
//     ) {
//       console.warn(
//         `API resolved without sending a response for ${req.url}, this may result in stalled requests.`
//       )
//     }
//   } catch (err) {
//     if (err instanceof ApiError) {
//       sendError(apiRes, err.statusCode, err.message)
//     } else {
//       console.error(err)
//       if (onError) await onError({ err })
//       if (propagateError) {
//         throw err
//       }
//       sendError(apiRes, 500, 'Internal Server Error')
//     }
//   }
// }

/**
 * Parse incoming message like `json` or `urlencoded`
 * @param req request object
 */
export async function parseBody(
  req: JoyApiRequest,
  limit: string | number
): Promise<any> {
  const contentType = parse(req.headers["content-type"] || "text/plain");
  const { type, parameters } = contentType;
  const encoding = parameters.charset || "utf-8";

  let buffer;

  try {
    buffer = await getRawBody(req, { encoding, limit });
  } catch (e) {
    if (e.type === "entity.too.large") {
      throw new ApiError(413, `Body exceeded ${limit} limit`);
    } else {
      throw new ApiError(400, "Invalid body");
    }
  }

  const body = buffer.toString();

  if (type === "application/json" || type === "application/ld+json") {
    return parseJson(body);
  } else if (type === "application/x-www-form-urlencoded") {
    const qs = require("querystring");
    return qs.decode(body);
  } else {
    return body;
  }
}

/**
 * Parse `JSON` and handles invalid `JSON` strings
 * @param str `JSON` string
 */
function parseJson(str: string): object {
  if (str.length === 0) {
    // special-case empty json body, as it's a common client-side mistake
    return {};
  }

  try {
    return JSON.parse(str);
  } catch (e) {
    throw new ApiError(400, "Invalid JSON");
  }
}

/**
 * Parsing query arguments from request `url` string
 * @param url of request
 * @returns Object with key name of query argument and its value
 */
export function getQueryParser({ url }: IncomingMessage) {
  return function parseQuery(): JoyApiRequestQuery {
    const { URL } = require("url");
    // we provide a placeholder base url because we only want searchParams
    const params = new URL(url, "https://n").searchParams;

    const query: { [key: string]: string | string[] } = {};
    for (const [key, value] of params) {
      if (query[key]) {
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(value);
        } else {
          query[key] = [query[key], value];
        }
      } else {
        query[key] = value;
      }
    }

    return query;
  };
}

/**
 * Parse cookies from `req` header
 * @param req request object
 */
export function getCookieParser(req: IncomingMessage) {
  return function parseCookie(): JoyApiRequestCookies {
    const header: undefined | string | string[] = req.headers.cookie;

    if (!header) {
      return {};
    }

    const { parse: parseCookieFn } = require("cookie");
    return parseCookieFn(Array.isArray(header) ? header.join(";") : header);
  };
}

/**
 *
 * @param res response object
 * @param statusCode `HTTP` status code of response
 */
export function sendStatusCode(
  res: JoyApiResponse,
  statusCode: number
): JoyApiResponse<any> {
  res.statusCode = statusCode;
  return res;
}

/**
 *
 * @param res response object
 * @param [statusOrUrl] `HTTP` status code of redirect
 * @param url URL of redirect
 */
export function redirect(
  res: JoyApiResponse,
  statusOrUrl: string | number,
  url?: string
): JoyApiResponse<any> {
  if (typeof statusOrUrl === "string") {
    url = statusOrUrl;
    statusOrUrl = 307;
  }
  if (typeof statusOrUrl !== "number" || typeof url !== "string") {
    throw new Error(
      `Invalid redirect arguments. Please use a single argument URL, e.g. res.redirect('/destination') or use a status code and URL, e.g. res.redirect(307, '/destination').`
    );
  }
  res.writeHead(statusOrUrl, { Location: url }).end();
  return res;
}

function sendEtagResponse(
  req: JoyApiRequest,
  res: JoyApiResponse,
  body: string | Buffer
): boolean {
  const etag = generateETag(body);

  if (fresh(req.headers, { etag })) {
    res.statusCode = 304;
    res.end();
    return true;
  }

  res.setHeader("ETag", etag);
  return false;
}

/**
 * Send `any` body to response
 * @param req request object
 * @param res response object
 * @param body of response
 */
export function sendData(
  req: JoyApiRequest,
  res: JoyApiResponse,
  body: any
): void {
  if (body === null) {
    res.end();
    return;
  }

  const contentType = res.getHeader("Content-Type");

  if (body instanceof Stream) {
    if (!contentType) {
      res.setHeader("Content-Type", "application/octet-stream");
    }
    body.pipe(res);
    return;
  }

  const isJSONLike = ["object", "number", "boolean"].includes(typeof body);
  const stringifiedBody = isJSONLike ? JSON.stringify(body) : body;

  if (sendEtagResponse(req, res, stringifiedBody)) {
    return;
  }

  if (Buffer.isBuffer(body)) {
    if (!contentType) {
      res.setHeader("Content-Type", "application/octet-stream");
    }
    res.setHeader("Content-Length", body.length);
    res.end(body);
    return;
  }

  if (isJSONLike) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }

  res.setHeader("Content-Length", Buffer.byteLength(stringifiedBody));
  res.end(stringifiedBody);
}

/**
 * Send `JSON` object
 * @param res response object
 * @param jsonBody of data
 */
export function sendJson(res: JoyApiResponse, jsonBody: any): void {
  // Set header to application/json
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // Use send to handle request
  res.send(jsonBody);
}

const COOKIE_NAME_PRERENDER_BYPASS = `__prerender_bypass`;
const COOKIE_NAME_PRERENDER_DATA = `__joy_preview_data`;

export const SYMBOL_PREVIEW_DATA = Symbol(COOKIE_NAME_PRERENDER_DATA);
const SYMBOL_CLEARED_COOKIES = Symbol(COOKIE_NAME_PRERENDER_BYPASS);

export function tryGetPreviewData(
  req: IncomingMessage,
  res: ServerResponse,
  options: __ApiPreviewProps
): object | string | false {
  // Read cached preview data if present
  if (SYMBOL_PREVIEW_DATA in req) {
    return (req as any)[SYMBOL_PREVIEW_DATA] as any;
  }

  const getCookies = getCookieParser(req);
  let cookies: JoyApiRequestCookies;
  try {
    cookies = getCookies();
  } catch {
    // TODO: warn
    return false;
  }

  const hasBypass = COOKIE_NAME_PRERENDER_BYPASS in cookies;
  const hasData = COOKIE_NAME_PRERENDER_DATA in cookies;

  // Case: neither cookie is set.
  if (!(hasBypass || hasData)) {
    return false;
  }

  // Case: one cookie is set, but not the other.
  if (hasBypass !== hasData) {
    clearPreviewData(res as JoyApiResponse);
    return false;
  }

  // Case: preview session is for an old build.
  if (cookies[COOKIE_NAME_PRERENDER_BYPASS] !== options.previewModeId) {
    clearPreviewData(res as JoyApiResponse);
    return false;
  }

  const tokenPreviewData = cookies[COOKIE_NAME_PRERENDER_DATA];

  const jsonwebtoken = require("jsonwebtoken");
  let encryptedPreviewData: {
    data: string;
  };
  try {
    encryptedPreviewData = jsonwebtoken.verify(
      tokenPreviewData,
      options.previewModeSigningKey
    ) as typeof encryptedPreviewData;
  } catch {
    // TODO: warn
    clearPreviewData(res as JoyApiResponse);
    return false;
  }

  const decryptedPreviewData = decryptWithSecret(
    Buffer.from(options.previewModeEncryptionKey),
    encryptedPreviewData.data
  );

  try {
    // TODO: strict runtime type checking
    const data = JSON.parse(decryptedPreviewData);
    // Cache lookup
    Object.defineProperty(req, SYMBOL_PREVIEW_DATA, {
      value: data,
      enumerable: false,
    });
    return data;
  } catch {
    return false;
  }
}

function setPreviewData<T>(
  res: JoyApiResponse<T>,
  data: object | string, // TODO: strict runtime type checking
  options: {
    maxAge?: number;
  } & __ApiPreviewProps
): JoyApiResponse<T> {
  if (
    typeof options.previewModeId !== "string" ||
    options.previewModeId.length < 16
  ) {
    throw new Error("invariant: invalid previewModeId");
  }
  if (
    typeof options.previewModeEncryptionKey !== "string" ||
    options.previewModeEncryptionKey.length < 16
  ) {
    throw new Error("invariant: invalid previewModeEncryptionKey");
  }
  if (
    typeof options.previewModeSigningKey !== "string" ||
    options.previewModeSigningKey.length < 16
  ) {
    throw new Error("invariant: invalid previewModeSigningKey");
  }

  const jsonwebtoken = require("jsonwebtoken");

  const payload = jsonwebtoken.sign(
    {
      data: encryptWithSecret(
        Buffer.from(options.previewModeEncryptionKey),
        JSON.stringify(data)
      ),
    },
    options.previewModeSigningKey,
    {
      algorithm: "HS256",
      ...(options.maxAge !== undefined
        ? { expiresIn: options.maxAge }
        : undefined),
    }
  );

  // limit preview mode cookie to 2KB since we shouldn't store too much
  // data here and browsers drop cookies over 4KB
  if (payload.length > 2048) {
    throw new Error(
      `Preview data is limited to 2KB currently, reduce how much data you are storing as preview data to continue`
    );
  }

  const { serialize } = require("cookie") as typeof import("cookie");
  const previous = res.getHeader("Set-Cookie");
  res.setHeader(`Set-Cookie`, [
    ...(typeof previous === "string"
      ? [previous]
      : Array.isArray(previous)
      ? previous
      : []),
    serialize(COOKIE_NAME_PRERENDER_BYPASS, options.previewModeId, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      ...(options.maxAge !== undefined
        ? ({ maxAge: options.maxAge } as CookieSerializeOptions)
        : undefined),
    }),
    serialize(COOKIE_NAME_PRERENDER_DATA, payload, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      ...(options.maxAge !== undefined
        ? ({ maxAge: options.maxAge } as CookieSerializeOptions)
        : undefined),
    }),
  ]);
  return res;
}

function clearPreviewData<T>(res: JoyApiResponse<T>): JoyApiResponse<T> {
  if (SYMBOL_CLEARED_COOKIES in res) {
    return res;
  }

  const { serialize } = require("cookie") as typeof import("cookie");
  const previous = res.getHeader("Set-Cookie");
  res.setHeader(`Set-Cookie`, [
    ...(typeof previous === "string"
      ? [previous]
      : Array.isArray(previous)
      ? previous
      : []),
    serialize(COOKIE_NAME_PRERENDER_BYPASS, "", {
      // To delete a cookie, set `expires` to a date in the past:
      // https://tools.ietf.org/html/rfc6265#section-4.1.1
      // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
      expires: new Date(0),
      httpOnly: true,
      sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    }),
    serialize(COOKIE_NAME_PRERENDER_DATA, "", {
      // To delete a cookie, set `expires` to a date in the past:
      // https://tools.ietf.org/html/rfc6265#section-4.1.1
      // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
      expires: new Date(0),
      httpOnly: true,
      sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    }),
  ]);

  Object.defineProperty(res, SYMBOL_CLEARED_COOKIES, {
    value: true,
    enumerable: false,
  });
  return res;
}

/**
 * Custom error class
 */
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Sends error in `response`
 * @param res response object
 * @param statusCode of response
 * @param message of response
 */
export function sendError(
  res: JoyApiResponse,
  statusCode: number,
  message: string
): void {
  res.statusCode = statusCode;
  res.statusMessage = message;
  res.end(message);
}

interface LazyProps {
  req: JoyApiRequest;
  params?: Params | boolean;
}

/**
 * Execute getter function only if its needed
 * @param LazyProps `req` and `params` for lazyProp
 * @param prop name of property
 * @param getter function to get data
 */
export function setLazyProp<T>(
  { req, params }: LazyProps,
  prop: string,
  getter: () => T
): void {
  const opts = { configurable: true, enumerable: true };
  const optsReset = { ...opts, writable: true };

  Object.defineProperty(req, prop, {
    ...opts,
    get: () => {
      let value = getter();
      if (params && typeof params !== "boolean") {
        value = { ...value, ...params };
      }
      // we set the property on the object to avoid recalculating it
      Object.defineProperty(req, prop, { ...optsReset, value });
      return value;
    },
    set: (value) => {
      Object.defineProperty(req, prop, { ...optsReset, value });
    },
  });
}
