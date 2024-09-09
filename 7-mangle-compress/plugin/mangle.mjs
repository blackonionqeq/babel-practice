// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'

// console.log(addDefault)
// console.log(declare)

/**
 * @typedef {import('@babel/types')} type
 * @typedef {import('@babel/types').TSType} TSType
 * @typedef {import('@babel/traverse').NodePath} NodePath
 */

export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)
  const base54 = (()=>{
    const DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_"
    const len = DIGITS.length
    /**
     * @param {number} num
     */
    return (num) => {
      let ret = ''
      do {
        ret = DIGITS.charAt(num % 54) + ret
        num = Math.floor(num / 54)
      } while (num > 0)
      return ret
    } 
  })()

  /**
   * 
   * @param {NodePath} path 
   */
  function canExistFromCompletion(path) {
    return path.isFunctionDeclaration() || path.isVariableDeclaration({ kind: 'var' })
  }
  return {
    pre(file) {
      file.uid = 0
    },
    visitor: {
      // 
      /**
       * 变量名混淆，让代码更难懂；
       * 各种类型的别名可在这里看到:
       * @link https://github.com/babel/babel/blob/main/packages/babel-types/src/ast-types/generated/index.ts#L2489-L2535
       */
      Scopable: {
        exit(path, state) {
          let uid = state.file.uid
          Object.entries(path.scope.bindings).forEach(([key, binding]) => {
            if (binding.mangled) return
            binding.mangled = true
            const newName = path.scope.generateUid(
              base54(uid++)
            )
            // console.log(newName)
            // rename会自动处理含有引用的binding
            binding.path.scope.rename(key, newName)
          })
          state.file.uid = uid
        }
      },
    },
  }
})

export default plugin
