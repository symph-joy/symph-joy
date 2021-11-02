import { NodePath, PluginObj, types as BabelTypes } from "@babel/core";
const joyClient = require("@symph/joy/dist/index-client");

export default function ({ types }: { types: typeof BabelTypes }): PluginObj<any> {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>, state) {
        const source = path.node.source.value;
        if (source !== "@symph/joy") return;
        const { isServer } = state.opts;
        if (isServer === false) {
          path.node.source.value = "@symph/joy/dist/index-client";
          // output help message
          path.node.specifiers.forEach((spec) => {
            // @ts-ignore
            const name = spec.imported.name;
            if (!Object.keys(joyClient).includes(name)) {
              throw path.buildCodeFrameError(`Error import { ${name} } from "@symph/joy", ${name} is a server side component, can not used in client side.`);
            }
          });
        } else if (isServer === true) {
          path.node.source.value = "@symph/joy/dist/index-server";
        }
      },
    },
  };
}
