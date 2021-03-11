/**
COPYRIGHT (c) 2017-present James Kyle <me@thejameskyle.com>
 MIT License
 Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWAR
*/
// Implementation of this PR: https://github.com/jamiebuilds/react-loadable/pull/132
// Modified to strip out unneeded results for Joy's specific use case

import url from "url";
import filePath from "path";
import crypto from "crypto";
import * as webpack from "webpack";
const dev = process.env.NODE_ENV === "development";

function buildManifest(
  compiler: webpack.Compiler,
  compilation: webpack.compilation.Compilation
) {
  const context = compiler.options.context;
  const manifest: { [key: string]: Array<webpack.compilation.Module> } = {};

  compilation.chunks.forEach((chunk) => {
    chunk.files.forEach((file: string) => {
      for (const module of chunk.modulesIterable) {
        const id = module.id;
        const name =
          typeof module.libIdent === "function"
            ? module.libIdent({ context })
            : null;
        // If it doesn't end in `.js` Joy can't handle it right now.
        if (!file.match(/\.js$/) || !file.match(/^static\/chunks\//)) {
          return;
        }

        // eslint-disable-next-line
        const publicPath = url.resolve(
          compilation.outputOptions.publicPath || "",
          file
        );

        let currentModule = module;
        if (module.constructor.name === "ConcatenatedModule") {
          currentModule = module.rootModule;
        }

        if (!currentModule.resource) {
          // 不是原始module，例如：css提取插件生成的module
          return;
        }

        // 这里需要和loader组件的module里定义的名字一致，该属性由react-loadable-plugin.js babel插件自动生成，
        // 不一致将导致无法将页面依赖的的module注入到index.html中。
        const resource = filePath.parse(currentModule.resource);
        let moduleId = `${resource.dir}${filePath.sep}${resource.name}`;
        if (!dev) {
          moduleId = crypto.createHash("md5").update(moduleId).digest("hex");
        }

        if (!manifest[moduleId]) {
          manifest[moduleId] = [];
        }
        manifest[moduleId].push({ id, name, file, publicPath });
      }
    });
  });

  return manifest;
}

export class ReactLoadablePlugin {
  filename: string;
  constructor({ filename }: { filename: string }) {
    this.filename = filename;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync(
      "ReactLoadableManifest",
      (compilation, callback) => {
        const manifest = buildManifest(compiler, compilation);
        let json = JSON.stringify(manifest, null, 2);
        compilation.assets[this.filename] = {
          source() {
            return json;
          },
          size() {
            return json.length;
          },
        };
        callback();
      }
    );
  }
}
