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
      // 压缩代码：删除没被使用的变量、纯函数
      Scopable(path) {
        Object.entries(path.scope.bindings).forEach(([key, binding]) => {
          // 这个变量没有被引用过
          if (!binding.referenced) {
            // 看前面注释，是否有PURE，PURE且没被引用说明整个删掉不会有影响
            const init = binding.path.get('init')
            if (init.isCallExpression()) {
              const comments = init.node.leadingComments
              if (comments?.[0]) {
                comments[0].value.includes('PURE') && binding.path.remove()
                return
              }
            }

            // api的isPure为true例如字符串字面量\标识符等，删除了没影响
            if (path.scope.isPure(binding.path.node.init)) {
              binding.path.remove()
            } else {
              // 如果不是pure，则只保留右边的部分
              binding.path.parentPath.replaceWith(
                api.types.expressionStatement(binding.path.node.init)
              )
            }
          }
        })
      },
      // 压缩代码： 删除blockstatement中return\throw语句后面的内容
      BlockStatement(path, state) {
        const statementsPaths = path.get('body')
        let purge = false
        for (let i = 0; i < statementsPaths.length; i++) {
          // 怎么知道有这个api呢？也许到头来还是要遍历一次看看方法名
          if (statementsPaths[i].isCompletionStatement()) {
            purge = true
            continue
          }
          if (purge && !canExistFromCompletion(statementsPaths[i])) {
            // 注意第一次使用的remove方法
            statementsPaths[i].remove()
          }
        }
      },
    },
  }
})

export default plugin
