import { EventEmitter } from "events";
import { IncomingMessage, ServerResponse } from "http";
import { join, posix } from "path";
import { parse } from "url";
import webpack, { Compilation, Module, MultiCompiler, NormalModule } from "webpack";
import * as Log from "../build/output/log";
import { normalizePagePath, normalizePathSep } from "../joy-server/server/normalize-page-path";
import { pageNotFoundError } from "../joy-server/server/require";
import { findPageFile } from "./lib/find-page-file";
import getRouteFromEntrypoint from "../joy-server/server/get-route-from-entrypoint";
import { date } from "@tsed/schema";
import Watcher from "watchpack/Watcher";

export const ADDED = Symbol("added");
export const BUILDING = Symbol("building");
export const BUILT = Symbol("built");

export const COMPILER_DONE_EVENT = Symbol("compile_done");

type MultiWatching = ReturnType<MultiCompiler["watch"]>;

export enum CompileStatusEnum {
  ADDED,
  BUILDING,
  BUILT,
}

export const entries: {
  [page: string]: {
    serverBundlePath: string;
    clientBundlePath: string;
    absolutePagePath: string;
    status?: typeof ADDED | typeof BUILDING | typeof BUILT;
    lastActiveTime?: number;
  };
} = {};

function isNormalModule(mod: Module): mod is NormalModule {
  return !!(mod as any).resource;
}

interface CompileModule {
  path: string;
  status: CompileStatusEnum;
}

export default class OnDemandModuleHandler {
  private doneCallbacks: EventEmitter = new EventEmitter();
  private compileModules = new Map<string, CompileStatusEnum>();
  private invalidator: Invalidator;

  constructor(private multiCompiler: webpack.MultiCompiler) {
    const { compilers } = multiCompiler;
    this.invalidator = new Invalidator(multiCompiler);

    for (const compiler of compilers) {
      compiler.hooks.make.tap("JoyJsOnDemandEntries", (_compilation: Compilation) => {
        this.invalidator.startBuilding();
      });
    }
    multiCompiler.hooks.done.tap("JoyJsOnDemandModules", (multiStats) => {
      const [clientStats, serverStats, apiState] = multiStats.stats;
      const { compilation } = clientStats;
      const { modules } = compilation;
      for (const mod of modules) {
        const { resource } = mod as never;
        if (resource) {
          const mod = this.compileModules.get(resource);
          if (mod !== undefined && (mod === CompileStatusEnum.ADDED || mod === CompileStatusEnum.BUILDING)) {
            this.doneCallbacks.emit(resource);
          }
        }
      }

      const { compilation: apiCompilation } = apiState;
      const { modules: apiModules } = apiCompilation;
      for (const mod of apiModules) {
        const { resource } = mod as never;
        if (resource) {
          const mod = this.compileModules.get(resource);
          if (mod !== undefined && (mod === CompileStatusEnum.ADDED || mod === CompileStatusEnum.BUILDING)) {
            this.doneCallbacks.emit(resource);
          }
        }
      }

      this.invalidator.doneBuilding();
      this.doneCallbacks.emit(COMPILER_DONE_EVENT);
    });

    // todo 在合适的时候，清理this.compileModules中不必要的数据, 否则： 有可能模块文件已经不能存在了
    // const disposeHandler = setInterval(function () {
    //   disposeInactiveEntries(watcher, lastAccessPages, maxInactiveAge)
    // }, 5000)
    // disposeHandler.unref && disposeHandler.unref()
  }

  public watch(watcher: MultiWatching) {
    this.invalidator.watch(watcher);
    this.multiCompiler.hooks.invalid.tap("JoyOnDemandModuleInvalid", () => {
      this.invalidator.startBuilding();
    });
    // this.invalidator = new Invalidator(watcher, this.multiCompiler);
  }

  public async ensureModules(moduleFilePaths: string[]): Promise<void> {
    if (!moduleFilePaths || !moduleFilePaths.length) {
      return;
    }

    const unresolvedModules: string[] = [];
    for (const modulePath of moduleFilePaths) {
      let status = this.compileModules.get(modulePath);
      if (status === undefined) {
        status = CompileStatusEnum.ADDED;
        this.compileModules.set(modulePath, status);
      }

      if (status !== CompileStatusEnum.BUILT) {
        unresolvedModules.push(modulePath);
      }
    }

    if (unresolvedModules.length === 0) {
      return;
    }

    const rst = new Promise<void>((resolve, reject) => {
      const timeout = 30000;
      setTimeout(() => {
        if (unresolvedModules.length > 0) {
          Log.warn(`Warning: Build module timeout ${timeout}, modules:${unresolvedModules}`);
        }
      }, timeout);
      for (let i = 0; i < unresolvedModules.length; i++) {
        const moduleFilePath = unresolvedModules[i];
        this.doneCallbacks.once(moduleFilePath, (err: Error) => {
          if (err) return reject(err);
          this.compileModules.set(moduleFilePath, CompileStatusEnum.BUILT);
          unresolvedModules.splice(unresolvedModules.indexOf(moduleFilePath), 1);
          if (unresolvedModules.length === 0) {
            resolve();
          }
        });
      }
    });
    this.invalidator.invalidate();
    return rst;
  }

  async ensureCompilerDone(): Promise<void> {
    if (!this.invalidator.building && !this.invalidator.rebuildAgain) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      const listener = (err: Error) => {
        if (err) return reject(err);
        if (this.invalidator.building || this.invalidator.rebuildAgain) {
          this.doneCallbacks.once(COMPILER_DONE_EVENT, listener);
          return;
        }
        resolve();
      };
      this.doneCallbacks.once(COMPILER_DONE_EVENT, listener);
    });
  }

  //todo 在路由层面处理路由的ping，然后删除下面部分。
  // public handlePing(pg: string) {
  //   const page = normalizePathSep(pg)
  //   const entryInfo = entries[page]
  //   let toSend
  //
  //   // If there's no entry, it may have been invalidated and needs to be re-built.
  //   if (!entryInfo) {
  //     // if (page !== lastEntry) client pings, but there's no entry for page
  //     return { invalid: true }
  //   }
  //
  //   // 404 is an on demand entry but when a new page is added we have to refresh the page
  //   if (page === '/_error') {
  //     toSend = { invalid: true }
  //   } else {
  //     toSend = { success: true }
  //   }
  //
  //   // We don't need to maintain active state of anything other than BUILT entries
  //   if (entryInfo.status !== BUILT) return
  //
  //   // If there's an entryInfo
  //   if (!lastAccessPages.includes(page)) {
  //     lastAccessPages.unshift(page)
  //
  //     // Maintain the buffer max length
  //     if (lastAccessPages.length > pagesBufferLength) {
  //       lastAccessPages.pop()
  //     }
  //   }
  //   entryInfo.lastActiveTime = Date.now()
  //   return toSend
  // }
}

// Make sure only one invalidation happens at a time
// Otherwise, webpack hash gets changed and it'll force the client to reload.
class Invalidator {
  private multiCompiler: webpack.MultiCompiler;
  private watcher: MultiWatching;
  public building: boolean;
  public rebuildAgain: boolean;

  constructor(multiCompiler: webpack.MultiCompiler) {
    this.multiCompiler = multiCompiler;
    // this.watcher = watcher;
    // contains an array of types of compilers currently building
    this.building = false;
    this.rebuildAgain = false;
  }

  public watch(watcher: MultiWatching) {
    this.watcher = watcher;
  }

  invalidate() {
    // If there's a current build is processing, we won't abort it by invalidating.
    // (If aborted, it'll cause a client side hard reload)
    // But let it to invalidate just after the completion.
    // So, it can re-build the queued pages at once.
    if (this.building) {
      this.rebuildAgain = true;
      return;
    }

    this.building = true;
    // Work around a bug in webpack, calling `invalidate` on Watching.js
    // doesn't trigger the invalid call used to keep track of the `.done` hook on multiCompiler
    for (const compiler of this.multiCompiler.compilers) {
      // @ts-ignore TODO: Check if this is still needed with webpack 5
      compiler.hooks.invalid.call();
    }
    this.watcher.invalidate();
  }

  startBuilding() {
    this.building = true;
  }

  doneBuilding() {
    this.building = false;

    if (this.rebuildAgain) {
      this.rebuildAgain = false;
      this.invalidate();
    }
  }
}
