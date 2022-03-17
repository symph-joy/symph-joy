import { PluginObj, types as BabelTypes } from "@babel/core";
import templateBuilder from "@babel/template";
import * as path from "path";
import { existsSync, readdirSync } from "fs-extra";
import { statSync } from "fs";

function isJsModule(requirePath: string, currentFile: string): boolean {
  let lstSeg = requirePath.split(/[\\/]/).pop() as string;
  const dotIndex = lstSeg.indexOf(".");
  const suffix = dotIndex >= 0 ? lstSeg.slice(dotIndex) : undefined;
  if (!suffix) {
    return true;
  } else if (/(jsx?|tsx?)$/i.test(suffix)) {
    return true;
  } else if (/(css|less|sass|scss|png|jgp|svg|icon?)$/.test(suffix)) {
    return false;
  } else {
    const curDir = path.dirname(currentFile);
    const distFilePath = path.resolve(curDir, requirePath);
    if (existsSync(distFilePath)) {
      return false;
    } else {
      return isJSFileExist(distFilePath);
    }
  }
}

function isJSFileExist(fileBasePath: string, suffix = /^\.(jsx?|tsx?)$/i): boolean {
  const distFileBasename = path.basename(fileBasePath);
  const distDir = path.dirname(fileBasePath);
  const stateDistDir = statSync(distDir);
  if (!stateDistDir.isDirectory()) {
    return false;
  }
  const distFiles = readdirSync(distDir, { withFileTypes: true });
  for (const file of distFiles) {
    if (file.isFile()) {
      const fBasename = path.basename(file.name);
      if (!fBasename.startsWith(distFileBasename)) {
        continue;
      }
      const sf = fBasename.slice(distFileBasename.length);
      if (suffix.test(sf)) {
        return true;
      }
    } else if (file.isDirectory()) {
      const fBasename = path.basename(file.name);
      if (fBasename === distFileBasename) {
        return isJSFileExist(path.join(fileBasePath, "index"), suffix);
      }
    }
  }
  return false;
}

const emptyModulePath = "@symph/joy/dist/build/babel-src/empty-module.js";

const emptyReactComponent = templateBuilder(`React.createElement('div', 'jsx placeholder')`)();

export default function ({ types: t }: { types: typeof BabelTypes }): PluginObj<any> {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const source = path.node.source.value;
        if (!isJsModule(source, state.filename)) {
          path.node.source.value = emptyModulePath;
          return;
        }
        if (source === "@symph/joy/dynamic") {
          path.node.source.value = "@symph/joy/dist/joy-server/lib/dynamic-empty";
        }
      },
      CallExpression(path, state) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === "require") {
          const arg0 = path.node.arguments[0];
          if (t.isStringLiteral(arg0)) {
            const requireValue = arg0.value;
            if (!isJsModule(requireValue, state.filename)) {
              // path.replaceWith(t.objectExpression([]));
              arg0.value = emptyModulePath;
            }
          }
        }
      },
      JSXElement(path) {
        // path.node = emptyReactComponent as any;
        path.replaceWith(emptyReactComponent as any);
      },
      JSXFragment(path) {
        // path.node = emptyReactComponent as any;
        path.replaceWith(emptyReactComponent as any);
      },
    },
  };
}
