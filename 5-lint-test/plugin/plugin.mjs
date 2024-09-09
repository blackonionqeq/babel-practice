// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'

// console.log(addDefault)
// console.log(declare)

/**
 * 
 * @typedef {import('@types/babel__core').PluginPass} PluginPass
 * @typedef {import('@types/babel__traverse').NodePath} NodePath
 */

export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)
  /**
   * @param {PluginPass} state
   * @param {NodePath} path 
   */
  function addError(state, path, errMsg) {
    
    const tmp = Error.stackTraceLimit
    Error.stackTraceLimit = 0
    // 注意要.file…又踩坑一次
    state.file.errors.push(
      // 上下文中有构建报错信息的api
      path.buildCodeFrameError(errMsg,  Error)
    )
    Error.stackTraceLimit = tmp
  }
  return {
    pre(file) {
      file.errors = []
    },
    visitor: {
      // 对for处理，判定判断方向和更新方向是否有误
      ForStatement(path, state) {
        // forstatement核心分三部分，init代表第一个分号前的部分，test代表第二个前的，update代表第二个后的
        // 所以如果要检查第二个前的符号，和第二个后的数值更改方向是否合理，就看test和update部分
        const test = path.get('test')
        const update = path.get('update')
        /** @type {string} */
        let shouldUpdateOperator
        if (['<', '<='].includes(test.node.operator)) shouldUpdateOperator = '++'
        else if (['>', '>='].includes(test.node.operator)) shouldUpdateOperator = '--'

        if (shouldUpdateOperator !== update.node.operator) {
          // 报错
          addError(state, update, "for direction error")
        }
      },
      // 判定赋值表达式是否赋值给了函数名，是的话记录报错信息
      AssignmentExpression(path, state) {
        const assignTo = path.node.left.name
        const binding = path.scope.getBinding(assignTo)
        if (binding?.path.isFunctionDeclaration() || binding?.path.isFunctionExpression()) {
          addError(state, path, "cannot reassign to function")
        }
      },
      // 判断是否使用了==\!=符号，是的话报错，再根据选项判定是否需要自动修复（加个=）
      BinaryExpression(path, state) {
        const oprt = path.node.operator
        if (['==', '!='].includes(oprt)) {
          const left = path.get('left')
          const right = path.get('right')
          if (typeof left.node.value !== typeof right.node.value) {
            if (options.autoFix) {
              path.node.operator += '='
            } else {
              addError(state, path, `please replace ${oprt} with ${oprt+'='}`)
            }
          }
        }
      },
    },
    post(file) {
      console.log(file.errors)
    },
  }
})

export default plugin
