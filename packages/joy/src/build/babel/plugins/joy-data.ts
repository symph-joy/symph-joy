import { NodePath, PluginObj, types as BabelTypes } from "@babel/core";
import { Identifier, StringLiteral } from "@babel/types";

export default function ({ types: t }: { types: typeof BabelTypes }): PluginObj<any> {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>, state) {
        const source = path.node.source.value;
        if (source !== "@symph/joy/data") return;

        const createHookSpecifier = path.get("specifiers").find((specifier) => {
          return specifier.isImportSpecifier() && ((specifier.node.imported as Identifier).name === "createHook" || (specifier.node.imported as StringLiteral).value === "createHook");
        });

        if (!createHookSpecifier) return;

        const bindingName = createHookSpecifier.node.local.name;
        const binding = path.scope.getBinding(bindingName);

        if (!binding) {
          return;
        }

        binding.referencePaths.forEach((refPath) => {
          const callExpression = refPath.parentPath;

          if (!callExpression || !callExpression.isCallExpression()) return;

          let args: any = callExpression.get("arguments");

          if (!args[0]) {
            throw callExpression.buildCodeFrameError("first argument to createHook should be a function");
          }

          if (!args[1]) {
            callExpression.node.arguments.push(t.objectExpression([]));
          }

          args = callExpression.get("arguments");

          args[1].node.properties.push(t.objectProperty(t.identifier("key"), t.stringLiteral(state.opts.key)));
        });
      },
    },
  };
}
