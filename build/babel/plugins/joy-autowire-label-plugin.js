import { PluginObj } from '@babel/core'
import { NodePath } from '@babel/traverse'
import * as BabelTypes from '@babel/types'

export default function ({ types: t }: { types: typeof BabelTypes }, { autoBingding = false }): PluginObj {
  return {
    pre: (file) => {
      let importAutowire
      let decorAutowire
      let identifyAutowire = t.identifier('autowire')
      file.path.traverse({
        ImportDeclaration (importPath) {
          if (importPath.node.source.value === '@symph/joy/autowire' || importPath.node.source.value === '@symph/tempo/autowire') {
            importAutowire = importPath
            decorAutowire = importPath.get('specifiers').find(item =>
              item.node.type === 'ImportDefaultSpecifier' || (item.node.imported && item.get('imported.name').node === 'autowire')
            )
          }
        }
      })
      if (!importAutowire) return // this file has no autowire

      // add '@autowire()' decoration on model props, if not exist
      file.path.traverse({
        ClassDeclaration (clazz: NodePath<BabelTypes.ClassDeclaration>) {
          clazz.traverse({
            ClassProperty (classProperty: NodePath<BabelTypes.ClassProperty>) {
              if (classProperty.get('decorators').length && classProperty.get('decorators').find(function (item) {
                return item.get('expression').isIdentifier() && item.get('expression.name').node === decorAutowire.node.local.name
              })) {
                throw new Error(`autowire decorator must called as a function, such as '@autowire()' on ${clazz.node.id.name}.${classProperty.node.key.name}`)
              }

              const propType = classProperty.node.typeAnnotation && classProperty.get('typeAnnotation.typeAnnotation.typeName')
              const autowire = classProperty.get('decorators').length && classProperty.get('decorators').find(item =>
                item.get('expression').isCallExpression() && item.get('expression.callee.name').node === decorAutowire.node.local.name
              )
              if (autowire && autowire.node) {
                // add 'type' to decorator params，if not exist
                let typeParam = autowire.node.expression.arguments.length > 0 && autowire.node.expression.arguments[0].properties &&
                  autowire.get('expression.arguments.0.properties').find(item => item.node.key.name === 'type')
                if (typeParam && typeParam.node) {
                  // all is ready, do nothing

                } else {
                  if (!propType || !propType.node) {
                    // can not read prop type.
                    throw new Error(`@autowire() cannot get the type of target. on ${clazz.node.id.name}.${classProperty.node.key.name}`)
                  }
                  // add a type param, as  @autowire({type: Model})
                  if (autowire.node.expression.arguments.length === 0) {
                    autowire.node.expression.arguments.unshift(t.objectExpression([]))
                  } else if (!autowire.get('expression.arguments.0').isObjectExpression()) {
                    throw new Error(`@autowire(param1), the first param must is a plain object. on ${clazz.node.id.name}.${classProperty.node.key.name}`)
                  }
                  typeParam = t.objectProperty(t.identifier('type'), propType.node)
                  autowire.node.expression.arguments[0].properties.unshift(typeParam)
                  file.path.scope.getBinding(propType.node.name).reference(autowire.get('expression.arguments.0.properties.0.value'))
                }
              } else {
                // the @autowire decoration has exist, here will do nothing
                if (autoBingding) {
                  if (propType) {
                    // ...todos 检查prop属性类型，是否是可以自动注入的类型，比如model类
                  }
                  // add @autowire decoration, so that inject the model at runtime
                  classProperty.node.decorators = [...(classProperty.node.decorators || [])]
                  classProperty.node.decorators.unshift(t.decorator(
                    t.callExpression(identifyAutowire,
                      [t.objectExpression(
                        [t.objectProperty(t.identifier('type'), propType.node)])
                      ]
                    ))
                  )
                  const callee = classProperty.get('decorators.0.expression.callee')
                  file.path.scope.getBinding(decorAutowire.node.local.name).reference(callee)
                  file.path.scope.getBinding(propType.node.name).reference(autowire.get('decorators.0.expression.callee.arguments.0.properties.0.value'))
                } else {
                  // ignore this property
                }
              }
            }
          })
        }
      })
    }
  }
}
