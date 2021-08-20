declare module "@babel/plugin-transform-modules-commonjs";
declare module "browserslist";
declare module "cssnano-simple" {
  import { Plugin } from "postcss";
  const cssnanoSimple: Plugin<{}>;
  export = cssnanoSimple;
}
declare module "styled-jsx/server";
declare module "unfetch";
declare module "webpack/lib/GraphHelpers";
declare module "webpack/lib/DynamicEntryPlugin";
declare module "webpack/lib/Entrypoint";

declare module "amphtml-validator" {
  import m from "amphtml-validator";
  export = m;
}
declare module "async-retry";
// declare module 'async-sema' {
//   import m from 'async-sema'
//   export = m
// }
declare module "arg/index.js" {
  function arg<T extends arg.Spec>(spec: T, options?: { argv?: string[]; permissive?: boolean }): arg.Result<T>;

  namespace arg {
    export type Handler = (value: string) => any;

    export interface Spec {
      [key: string]: string | Handler | [Handler];
    }

    export type Result<T extends Spec> = { _: string[] } & {
      [K in keyof T]: T[K] extends string ? never : T[K] extends Handler ? ReturnType<T[K]> : T[K] extends [Handler] ? Array<ReturnType<T[K][0]>> : never;
    };
  }

  export = arg;
}

// declare module "chalk" {
//   import m from "chalk";
//   export = m;
// }
declare module "ci-info" {
  import m from "ci-info";
  export = m;
}
declare module "compression" {
  import m from "compression";
  export = m;
}
declare module "conf" {
  import m from "conf";
  export = m;
}
// declare module 'content-type' {
//   import m from 'content-type'
//   export = m
// }
// declare module 'cookie' {
//   import m from 'cookie'
//   export = m
// }
declare module "debug" {
  import m from "debug";
  export = m;
}
declare module "devalue" {
  import m from "devalue";
  export = m;
}
// declare module 'dotenv' {
//   import m from 'dotenv'
//   export = m
// }

// declare module "dotenv-expand" {
//   import m from "dotenv-expand";
//   export = m;
// }
declare module "escape-string-regexp" {
  import m from "escape-string-regexp";
  export = m;
}
declare module "etag" {
  import m from "etag";
  export = m;
}
declare module "find-up" {
  import m from "find-up";
  export = m;
}
declare module "fresh" {
  import m from "fresh";
  export = m;
}
declare module "gzip-size" {
  import m from "gzip-size";
  export = m;
}
declare module "http-proxy" {
  import m from "http-proxy";
  export = m;
}
declare module "is-docker" {
  import m from "is-docker";
  export = m;
}
declare module "is-wsl" {
  import m from "is-wsl";
  export = m;
}
declare module "json5" {
  import m from "json5";
  export = m;
}
// declare module 'jsonwebtoken' {
//   import m11 from 'jsonwebtoken'
//   export = m11
// }
declare module "lodash.curry" {
  import m from "lodash.curry";
  export = m;
}
declare module "lru-cache" {
  import m from "lru-cache";
  export = m;
}
declare module "nanoid/index.js" {
  function nanoid(size?: number): string;
  export = nanoid;
}
declare module "node-fetch" {
  import m from "node-fetch";
  export = m;
}
declare module "ora" {
  import m from "ora";
  export = m;
}
// declare module 'path-to-regexp' {
//   import m from 'path-to-regexp'
//   export = m
// }
declare module "raw-body" {
  import m from "raw-body";
  export = m;
}
// declare module 'recast' {
//   import m from 'recast'
//   export = m
// }
declare module "resolve/index.js" {
  import m from "resolve";
  export = m;
}
declare module "send" {
  import m from "send";
  export = m;
}
declare module "source-map" {
  import m from "source-map";
  export = m;
}
declare module "string-hash" {
  import m from "string-hash";
  export = m;
}
declare module "strip-ansi" {
  import m from "strip-ansi";
  export = m;
}
declare module "terser" {
  import m from "terser";
  export = m;
}
declare module "semver" {
  import m from "semver";
  export = m;
}
declare module "text-table" {
  function textTable(
    rows: Array<Array<{}>>,
    opts?: {
      hsep?: string;
      align?: Array<"l" | "r" | "c" | ".">;
      stringLength?(str: string): number;
    }
  ): string;

  export = textTable;
}
// declare module "unistore" {
//   import m from "unistore";
//   export = m;
// }

declare module "terser-webpack-plugin";
declare module "comment-json" {
  import m from "comment-json";
  export = m;
}

declare module "pnp-webpack-plugin" {
  import webpack from "webpack";

  class PnpWebpackPlugin extends webpack.Plugin {}

  export = PnpWebpackPlugin;
}

declare namespace NodeJS {
  interface ProcessVersions {
    pnp?: string;
  }
  interface Process {
    crossOrigin?: string;
  }
}

declare module "watchpack" {
  import { EventEmitter } from "events";

  class Watchpack extends EventEmitter {
    constructor(options?: any);
    watch(files: string[], directories: string[], startTime?: number): void;
    close(): void;

    getTimeInfoEntries(): Map<string, { safeTime: number; timestamp: number; accuracy?: number }>;
  }

  export default Watchpack;
}
