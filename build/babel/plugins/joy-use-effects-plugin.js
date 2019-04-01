import { PluginObj } from '@babel/core'
import * as BabelTypes from '@babel/types'

export default function ({ types: t }: { types: typeof BabelTypes }, { autoBingding = false }): PluginObj {
  return {
    pre: (file) => {
      let useEffectImportSpecifier, importReact, useJoyEffectImportSpecifier, importHook
      file.path.traverse({
        ImportDeclaration (importPath) {
          if (importPath.node.source.value === 'react') {
            importReact = importPath
            useEffectImportSpecifier = importPath.get('specifiers').find(item =>
              (item.node.imported && item.get('imported.name').node === 'useEffect')
            )
          } else if (importPath.node.source.value === '@symph/joy/hook' || importPath.node.source.value === '@symph/tempo/hook') {
            importHook = importPath
            useJoyEffectImportSpecifier = importPath.get('specifiers').find(item =>
              (item.node.imported && item.get('imported.name').node === 'useEffect')
            )
          }
        }
      })
      if (!useEffectImportSpecifier) return // this file has no useEffects

      // 检查是否已经导入 `import {useEffect} from '@symph/joy/hook'`
      if (!importHook) {
        importHook = importReact.insertAfter(t.importDeclaration([], t.stringLiteral('@symph/tempo/hook')))[0]
      }
      if (!useJoyEffectImportSpecifier) {
        const idtUseEffect = file.path.scope.generateUidIdentifier('useEffect')
        useJoyEffectImportSpecifier = (importHook.unshiftContainer('specifiers', t.importSpecifier(idtUseEffect, t.identifier('useEffect')))[0])
        file.path.scope.registerBinding(useJoyEffectImportSpecifier.node.local.name, useJoyEffectImportSpecifier.get('local'))
        // file.path.scope.binding(useJoyEffect.node.name)
      }

      // replace react.useEffects to @symph/tempo/hooks.userEffects
      file.path.traverse({
        Identifier (path) {
          if (!path.isIdentifier({ name: useEffectImportSpecifier.node.local.name })) {
            return
          }
          if (path.findParent(p => p.isImportDeclaration())) {
            // 在import语句中，不处理
            return
          }
          path.replaceWith(useJoyEffectImportSpecifier.node.local)
          file.path.scope.getBinding(useJoyEffectImportSpecifier.node.local.name).reference(path)
        }
      })
    }
  }
}
