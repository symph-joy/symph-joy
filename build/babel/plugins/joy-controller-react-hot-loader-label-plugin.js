import { PluginObj } from '@babel/core'
import template from '@babel/template'
import { NodePath } from '@babel/traverse'
import * as BabelTypes from '@babel/types'

const requireRHL = template(
  `require('react-hot-loader/root').hot`
)()

export default function ({ types: t }: { types: typeof BabelTypes }): PluginObj {
  return {
    pre: (file) => {
      let importController
      let controller
      file.path.traverse({
        ImportDeclaration (importPath) {
          if (importPath.node.source.value === '@symph/joy/controller') {
            importController = importPath
            controller = importPath.get('specifiers').find(item => item.get('type').node === 'ImportDefaultSpecifier' || item.get('imported.name').node === 'controller')
          }
        }
      })
      if (!importController || !controller) return // this file has no controller

      // add 'hotLoader' to @controller(mapStateToProps, {hotLoader}), if not exist
      file.path.traverse({
        ClassDeclaration (clazz: NodePath<BabelTypes.ClassDeclaration>) {
          let decoController
          clazz.get('decorators').forEach((path, i) => {
            if (path.node.expression.callee && path.node.expression.callee.name === controller.node.local.name) {
              decoController = path
            }
          })
          if (!decoController) {
            return
          }

          if (!decoController.get('expression').isCallExpression()) {
            throw new Error(`controller decorator must called as a function, such as '@controller(mapStateToProps)' on ${clazz.node.id.name}`)
          }

          if (decoController.get('expression.arguments.0') === undefined) {
            decoController.node.expression.arguments.push(t.identifier('null'))
          }
          let arg1 = decoController.get('expression.arguments.1')
          if (arg1 === undefined) {
            decoController.node.expression.arguments.push(t.objectExpression([]))
            arg1 = decoController.get('expression.arguments.1')
          }

          let optHotLoader = arg1.get('properties').find(item => item.node.key.name === 'hotLoader')
          if (!optHotLoader) {
            arg1.node.properties.push(t.objectProperty(t.identifier('hotLoader'), requireRHL.expression))
            // optHotLoader = arg1.get('properties').find(item => item.node.key.name === 'hotLoader')
          }
        }
      })
    }
  }
}
