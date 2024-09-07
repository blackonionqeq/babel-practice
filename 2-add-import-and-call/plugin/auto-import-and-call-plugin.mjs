import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'

// console.log(addDefault)
// console.log(declare)

// 上面俩插件的ts类型可通过@types/babel__xxx来下载，如@types/babel__helper-plugin-utils
/**
 * 分两步，一是寻找import模块是否有引入目标名称模块，没有的话引入；
 * 二是寻找每种类型的函数，插入调用目标名称模块方法的代码；
 */
export const plugin = declare((api, options, dirname) => {
  // 用于声明babel版本是7，避免在6运行
  api.assertVersion(7)
  // console.log(api, options, dirname)
  return {
    visitor: {
      Program(path, state) {
        // 先找一轮声明，查询是否含有目标模块引用
        path.traverse({
          ImportDeclaration(path2) {
            // 查找声明的模块引用路径，如import aaa from 'asdf/vvv'中的'asdf/vvv'
            // 具体的查找方法，可以通过把sourceCode放到astexplorer.net后查看属性来确定查找路径
            if (path2.node.source.value === options.trackerPath) {
              const spcf = path2.node.specifiers[0]
              // 这里不同类型的声明，取得导入变量名的方法不同，这里只做一种的演示
              if (spcf.isImportNamespaceSpecifier()) {
                state.importFuncName = spcf.local.name
              }
              // 是外层，也就是program的stop！
              path.stop()
            }
          }
        })
        // 两种情况，如果遍历发现没有导入目标模块，则用ast导入，否则不用处理
        if (!state.importFuncName) {
          /**
           * 用哪个方法，以及语法，见下面的链接
           * 实现效果类似import _traker from trackerPath的效果，_traker要通过生成独立id实现，trakerPath则是传入的路径
           * @link https://babeljs.io/docs/babel-helper-module-imports
           */
          const ast = addDefault(path, options.trackerPath, {
            nameHint: path.scope.generateUid(options.trakerName ?? 'tracker')
          })
          state.importFuncName = ast.name
          // 把目标方法调用的ast也生成，方便后面复用
          // 类似_traker()
          state.importFuncCaller = api.template.statement(`${ast.name}()`)()
        }
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
        // path.get('body')
        // 注意，一定要用get才行，直接用path.node.body的话会缺乏上下文，拿不到path.node.body.node和path.node.body.replaceWith等属性
        const bodyPath = path.get('body')
        // 也可用body.isBlockStatement()
        if (path.node.body.type === 'BlockStatement') {
          // 也可用bodyPath.node.body
          path.node.body.body.unshift(state.importFuncCaller)
        } else {
          // 把类似() => 'aaa'替换为() => {_traker();return 'aaa';}
          const newBody = api.template.statement(`{${state.importFuncName}(); return PRE;}`)({ PRE: bodyPath.node })
          bodyPath.replaceWith(newBody)
        }
      }
    }
  }
})

export default plugin
