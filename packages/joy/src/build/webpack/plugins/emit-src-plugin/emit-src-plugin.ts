import { Compilation, Compiler, Module, NormalModule } from "webpack";
import path from "path";
import crypto from "crypto";
import { webpack5 } from "../../../../types/webpack5";
import { existsSync } from "fs";
import mkdirp from "mkdirp";
import OutputFileSystem = webpack5.OutputFileSystem;

function isNormalModule(mod: Module): mod is NormalModule {
  return !!(mod as any).resource;
}

function getModuleSourceValue(mod: NormalModule): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore deliberately, webpack/types.d.ts has not declared this properties
  return mod._source?._valueAsBuffer?.toString();
}

/**
 * webpack 的babel-loader不会转换es6的import语法，所以这里需要使用babel重新转换一次，以便在生产环境，能够正常被加载识别。
 * 待优化： 如果node的运行环境支持es6的import，则可以不用再转换。
 * @param src
 */
async function transformSource(src: string): Promise<string> {
  if (process.env.NODE_ENV === "test") {
    // 测试环境，会有jest的loader进行转换，所以不需要babel处理。
    return src;
  }
  const babel = require("@babel/core");
  return new Promise<string>((resolve, reject) => {
    babel.transform(
      src,
      {
        presets: [
          [
            "@babel/preset-env",
            {
              modules: "cjs",
            },
          ],
        ],
      },
      function (err: any, result: any) {
        if (err) {
          reject(err);
        }
        resolve(result?.code);
      }
    );
  });
}

export interface IWebpackEmitModule {
  resource: string;
  dest: string;
  hash: string;
}

export type TWebpackEmitModuleManifest = Map<string, IWebpackEmitModule>;

interface EmitAllPluginOptions {
  path?: string;
  ignoreExternals?: string;
  ignorePattern?: RegExp;
}

/**
 * todo 再次构建时读取上次构建的modules信息，如果未发生改变，不重新写入文件。
 */
export class EmitSrcPlugin {
  ignorePattern: RegExp;
  ignoreExternals: boolean;
  path?: string;
  modules: TWebpackEmitModuleManifest = new Map<string, IWebpackEmitModule>();

  constructor(opts: EmitAllPluginOptions = {}) {
    this.ignorePattern =
      opts.ignorePattern ||
      /([\\/]node_modules)|([\\/]joy[\\/]src)|([\\/]core[\\/]src)|([\\/]react[\\/]src)/;
    this.ignoreExternals = !!opts.ignoreExternals;
    this.path = opts.path;
  }

  shouldIgnore(path: string) {
    return this.ignorePattern.test(path);
  }

  getModuleSourceValueHash(mod: NormalModule): string {
    const hash = crypto.createHash("md4");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore deliberately, webpack/types.d.ts has not declared this properties
    hash.update(mod._source?._valueAsBuffer);
    const hastVal = hash.digest("hex");
    return hastVal.substr(0, 8);
  }

  async writeFile(
    outputFileSystem: OutputFileSystem,
    dest: string,
    content: Parameters<OutputFileSystem["writeFile"]>[1]
  ) {
    await new Promise<void>((resolve, reject) => {
      outputFileSystem.writeFile(dest, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async mkdir(
    outputFileSystem: OutputFileSystem,
    destDir: string,
    options: { recursive: boolean }
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      outputFileSystem.mkdir(destDir, options, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapPromise(
      "EmitAllPlugin",
      async (compilation: Compilation) => {
        console.log(">>>>>> EmitSrcPlugin, emit src files");
        const { modules } = compilation;
        const outputFileSystem: OutputFileSystem = compiler.outputFileSystem as any;
        const out = this.path || (compiler.options.output?.path as string);

        const isOutDirExists = await existsSync(out);
        if (!isOutDirExists) {
          await mkdirp(out);
        }

        for (const mod of modules) {
          if (!isNormalModule(mod) || mod.getNumberOfErrors() > 0) {
            continue;
          }
          const absolutePath = mod.resource;
          // @ts-ignore fixme how to determine mod is a external module
          if (this.ignoreExternals && mod.external) continue;
          if (this.shouldIgnore(absolutePath)) continue;

          // Used for vendor chunk
          if (mod.constructor.name === "MultiModule") continue;

          const cacheHash = this.getModuleSourceValueHash(mod);
          const cachedEmitMod = this.modules.get(absolutePath);
          if (cachedEmitMod) {
            if (cachedEmitMod.hash === cacheHash) {
              continue;
            }
          }

          let source = getModuleSourceValue(mod);
          source = await transformSource(source);
          const projectRoot = compiler.context;

          let dest = path.join(out, absolutePath.replace(projectRoot, ""));
          dest = dest.replace(/\.ts$/, ".js").replace(/\.tsx$/, ".jsx");

          await this.mkdir(outputFileSystem, path.dirname(dest), {
            recursive: true,
          });
          await this.writeFile(outputFileSystem, dest, source);

          this.modules.set(dest, {
            resource: absolutePath,
            dest,
            hash: cacheHash,
          });
        }

        const emitManifestPath = path.join(out, "emit-manifest.json");
        //JSON.stringify 不能直接序列化Map对象，需求先转换为对象。
        const objModules: Record<string, IWebpackEmitModule> = Object.create(
          null
        );
        for (const [k, v] of this.modules) {
          objModules[k] = v;
        }
        const emitManifestContent = JSON.stringify(objModules);
        await this.writeFile(
          outputFileSystem,
          emitManifestPath,
          emitManifestContent
        );
      }
    );
  }
}