import { NodePath, PluginObj, types as BabelTypes } from "@babel/core";
import templateBuilder from "@babel/template";

function isJsModule(requirePath: string) {
  let lstSeg = requirePath.split(/[\\/]/).pop() as string;
  const dotIndex = lstSeg.indexOf(".");
  const suffix = dotIndex >= 0 ? lstSeg.slice(dotIndex) : undefined;
  if (!suffix) {
    return true;
  } else if (/(jsx?|tsx?)$/i.test(suffix)) {
    return true;
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
        if (!isJsModule(source)) {
          path.node.source.value = emptyModulePath;
        }
      },
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === "require") {
          const arg0 = path.node.arguments[0];
          if (t.isStringLiteral(arg0)) {
            const requireValue = arg0.value;
            if (!isJsModule(requireValue)) {
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
