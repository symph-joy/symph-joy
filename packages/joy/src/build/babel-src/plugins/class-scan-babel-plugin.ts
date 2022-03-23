import { Node, NodePath, PluginObj, template, types as BabelTypes } from "@babel/core";
import { ObjectProperty } from "@babel/types";
import { Scope } from "@babel/traverse";

const emptyModulePath = "@symph/joy/dist/build/babel-src/empty-module.js";

const emptyFunctionBody = template.statement.ast(
  `{throw new Error("Function can not be executed during file scanning. \\n If it's a decorator function, should commented with \\"// @joy-scan\\"")}`
);

export default function ({ types: t }: { types: typeof BabelTypes }): PluginObj<any> {
  return {
    pre(state) {
      state.path.traverse({
        ClassMethod(path, state) {
          const body = path.get("body");
          if (path?.node?.kind === "constructor") {
            const emptyConstructor = template.statement.ast(`{super(...arguments);}`);
            body.replaceWith(emptyConstructor);
          } else {
            body.replaceWith(t.blockStatement([]));
          }
          path.skip();
        },
        FunctionDeclaration(path, state) {
          const body = path.get("body");
          if (hasComment(path, /@joy-scan/)) {
            // noop
          } else {
            body.replaceWith(emptyFunctionBody);
          }
          path.skip();
        },
        JSXElement(path) {
          path.replaceWith(t.expressionStatement(t.stringLiteral("__joy_jsx_placeholder")));
          path.skip();
        },
        JSXFragment(path) {
          path.replaceWith(t.expressionStatement(t.stringLiteral("__joy_jsx_placeholder")));
          path.skip();
        },
      });
    },
    visitor: {
      ImportDeclaration(path, state) {
        const source = path.node.source.value;
        if (!isJsModule(source, state.filename)) {
          path.node.source.value = emptyModulePath;
          return;
        }

        if (source === "@symph/joy/dynamic") {
          return (path.node.source.value = "@symph/joy/dist/joy-server/lib/dynamic-empty");
        }

        const specifiers = path.get("specifiers");
        let isBindingInModule = false;
        for (const specifier of specifiers) {
          let localName = specifier.node.local.name;
          if (checkIdIsUsing(path.scope, localName)) {
            isBindingInModule = true;
          }
        }
        if (!isBindingInModule) {
          path.remove();
          return;
        }
      },
      CallExpression(path, state) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === "require") {
          const arg0 = path.node.arguments[0];
          if (t.isStringLiteral(arg0)) {
            const requireValue = arg0.value;
            if (!isJsModule(requireValue, state.filename)) {
              arg0.value = emptyModulePath;
            }
          }
        }
      },
    },
    post(state) {
      // console.log();
    },
  };
}

function checkIdIsUsing(scope: Scope, identifier: string): boolean {
  let isBinding = scope.getBinding(identifier);
  const referencePaths = isBinding?.referencePaths;
  let isUsing = false;
  if (referencePaths && referencePaths.length > 0) {
    for (const referencePath of referencePaths) {
      if (referencePath.parentPath?.node?.type === "VariableDeclarator") {
        if (isSubPropUsing(referencePath)) {
          isUsing = true;
          break;
        }
      } else {
        isUsing = true;
        break;
      }
    }
  }
  return isUsing;
}

function isSubPropUsing(path: NodePath): boolean {
  // 是否有子属性当做装饰器
  // if (path.parentPath?.node?.type !== "VariableDeclarator") {
  //   return false;
  // }
  const idPath = path.parentPath?.get("id") as NodePath;
  if (idPath?.node?.type === "ObjectPattern") {
    const props = idPath.get("properties") as NodePath<ObjectProperty>[];
    for (const prop of props) {
      // @ts-ignore
      if (checkIdIsUsing(prop.scope, prop.node?.key?.name)) {
        return true;
      }
    }
  }
  // 如果子属性没有被使用，删除当前变量赋值语句。
  path.parentPath?.parentPath?.remove();
  return false;
}

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
    return true;
  }
}

function hasComment(path: NodePath, comment: string | RegExp): boolean {
  if (!path.node) {
    return false;
  }
  const line = path?.node?.loc?.start.line || 0;

  function getCommentNode(node: Node) {
    return node.leadingComments?.find((it) => {
      if (typeof comment === "string") {
        return it.value === comment;
      } else {
        return comment.test(it.value);
      }
    });
  }

  if (getCommentNode(path.node)) {
    return true;
  }

  // @ts-ignore
  if (line > 0 && path.parent?.loc?.start.line === line) {
    // @ts-ignore
    return !!getCommentNode(path.parent);
  }

  return false;
}
