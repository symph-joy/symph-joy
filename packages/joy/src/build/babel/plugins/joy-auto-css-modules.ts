import { NodePath, Visitor } from "@babel/traverse";
import { types as BabelTypes } from "@babel/core";
import { extname } from "path";

export interface IAutoCssModulesOpts {
  flag?: string;
}

const CSS_EXTNAMES = [".css", ".less", ".sass", ".scss", ".stylus", ".styl"];

export default function () {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>, { opts }: { opts: IAutoCssModulesOpts }) {
        const {
          specifiers,
          source,
          source: { value },
        } = path.node;
        if (specifiers.length && CSS_EXTNAMES.includes(extname(value))) {
          source.value = `${value}?${opts.flag || "modules"}`;
        }
      },
    } as Visitor,
  };
}
