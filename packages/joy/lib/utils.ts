import React, { ComponentType } from "react";
import { string } from "prop-types";
import { ServerResponse } from "http";

export function warn(message: any) {
  if (process.env.NODE_ENV !== "production") {
    console.error(message);
  }
}

export function execOnce(fn: Function): Function {
  let used = false;
  return (...args: any) => {
    if (!used) {
      used = true;
      //@ts-ignore
      fn.apply(this, args);
    }
  };
}

export function deprecated(fn: Function, message: any) {
  // else is used here so that webpack/uglify will remove the code block depending on the build environment
  if (process.env.NODE_ENV === "production") {
    return fn;
  } else {
    let warned = false;
    const newFn = function (...args: any) {
      if (!warned) {
        warned = true;
        console.error(message);
      }
      // @ts-ignore
      return fn.apply(this, args);
    };

    // copy all properties
    Object.assign(newFn, fn);

    return newFn;
  }
}

export function printAndExit(message: String, code = 1) {
  if (code === 0) {
    console.log(message);
  } else {
    console.error(message);
  }

  process.exit(code);
}

export function getDisplayName(
  Component: string | React.ComponentType
): String {
  if (typeof Component === "string") {
    return Component;
  }

  return Component.displayName || Component.name || "Unknown";
}

export function isResSent(res: ServerResponse) {
  return res.finished || res.headersSent;
}

export async function loadGetInitialProps(
  Component: React.ComponentType,
  ctx: any
): Promise<Object> {
  if (process.env.NODE_ENV !== "production") {
    if (Component.prototype && Component.prototype.getInitialProps) {
      const compName = getDisplayName(Component);
      const message = `"${compName}.getInitialProps()" is defined as an instance method`;
      throw new Error(message);
    }
  }

  // @ts-ignore
  if (!Component.getInitialProps) return {};

  // @ts-ignore
  const props = await Component.getInitialProps(ctx);

  if (ctx.res && isResSent(ctx.res)) {
    return props;
  }

  if (!props) {
    const compName = getDisplayName(Component);
    const message = `"${compName}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
    throw new Error(message);
  }

  return props;
}

export function getLocationOrigin(): string {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//${hostname}${port ? ":" + port : ""}`;
}

export function getURL(): string {
  const { href } = window.location;
  const origin = getLocationOrigin();
  return href.substring(origin.length);
}
