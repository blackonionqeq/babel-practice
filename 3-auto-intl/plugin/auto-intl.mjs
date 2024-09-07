// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'
import generator from '@babel/generator'
import fs from 'node:fs'
import { execSync, spawn, spawnSync } from 'node:child_process'


// console.log(addDefault)
// console.log(declare)
let idx = 0

/**
 * @typedef {import('@types/babel__traverse')} Traverse
 * @typedef {import('@types/babel__traverse').NodePath} NodePath
 * @typedef {import('@babel/types')} type
 * @typedef {import('@babel/types').StringLiteral} StringLiteral
 * @typedef {import('@babel/types').TemplateLiteral} TemplateLiteral
 */


export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)

  /** 
   * @param path {import('@types/babel__traverse').NodePath<import('@babel/types').StringLiteral|import('@babel/types').TemplateLiteral>
   * @returns {Boolean}
   * 
   * 判断节点是否应该跳过，跳过的条件是import语句（例如节点时import a from 'b'中的'b'的话要跳过），或注释了要跳过（例如let a = //i18n-disable 'fdsa'）
  */
  function checkShouldSkip(path) {
    if (path.findParent(p => p.isImportDeclaration())) return true
    if (path.node.leadingComments) {
      // path.node.leadingComments = path.node.leadingComments.filter((cmt, idx) => !cmt.value.includes('i18n-disable'))
      return path.node.leadingComments.some(comment => comment.value.includes('i18n-disable'))
    }
    return false
  }

  /**
   * @param path {NodePath}
   */
  function getReplaceExpression(path, param, uid) {
    if (path.isTemplateLiteral()) {
      let exp = path.node.expressions[0]
    }
    const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(i => generator.default(i).code) : null
    let replaceExpression = api.template.ast(`${uid}.t(${param}${expressionParams ? ','+expressionParams.join(','): ''})`).expression
    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p => p.isJSXExpressionContainer())) {
      replaceExpression = api.types.jSXExpressionContainer(replaceExpression)
    }
    return replaceExpression
  }
  /**
   * 总共分三步：
   * 第一步，如果没导入intl则导入
   * 第二步，找到字符串字面量或模板变量，以使用intl的方式替换，并把对应的i18n里的key作为参数传入intl.t中
   * 第三步，整合替换过程中的文本，把文本写入文件
   */
  return {
    pre(state) {
      console.log(state.metadata)
      state.kv = Object.create(null)
    },
    visitor: {
      Program(path, state) {
        // 判断是否有引入intl，如import intlObj from 'intlPath'
        // 有引入则忽略并记录引入对象名以便后面使用，没引入则引入且生成唯一对象名并记录
        let isImported = false
        path.traverse({
          ImportDeclaration(path2) {
            if (path2.node.source.value === options.intlPath) {
              isImported = true
              state.intlId = path2.node.specifiers[0].local.name
              // state.set('intlId', path2.node.specifiers[0].local.name)
            }
          }
        })
        if (!isImported) {
          const intlId = path.scope.generateUid(options.intlDefaultName ?? 'intlObj')
          // state.set('intlId', intlId)
          state.intlId = intlId
          // 注意后面的括号！又忘记一次
          const importIntlAst = api.template.statement(`import ${intlId} from '${options.intlPath}'`)()
          path.node.body.unshift(importIntlAst)
        }
      },
      StringLiteral(path, {file: state}) {
        if(!checkShouldSkip(path)) {
          const value = path.node.value
          const result = getReplaceExpression(path, idx, state.intlId)
          state.kv[idx++] = value
          path.replaceWith(result)
          // 注意不skip会无限循环
          path.skip()
        }
      },
      TemplateLiteral(path, {file:state}) {
        if (!checkShouldSkip(path)) {
          // 要把类似`aaa ${a+b} bbb ${cd} ccc`转为intl.t(intlKey, a+b, cd)的形式
          // 并把字符串部分替换为类似`aaa {placeholder} bbb {placeholder} ccc`的格式，方便后续找到placeholder进行替换
          const newVal = path.get('quasis').map(i => i.node.value.raw).join('{placeholder}')
          if (newVal) {
            // let key = 'intlKey'
            // const key = `${options.intlIdxKey}${idx}`
            
            const result = getReplaceExpression(path, idx, state.intlId)
            state.kv[idx++] = newVal
            path.replaceWith(result)
            path.skip()
          }
        }
      },
    },
    post(state) {
      // 把文本整理一下格式，写入文件中
      // 不知为啥spwanSync没法如期运行
      const data2Save = `const resource = ${JSON.stringify(state.kv, null, 2)};\nexport default resource;`
      console.log(data2Save)
      const dir = options.outputDir ?? 'dist'
      const preDir = '3-auto-intl'
      // spawnSync(`cat > zh_CN.js <<< EOF\n${data2Save}\nEOF`, { shell: true, encoding: 'utf-8' })
      const resultDir = preDir+'/'+dir+'/'
      if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir, { recursive: true })
      }
      fs.writeFileSync(resultDir+'zh_CN.js', data2Save)
      // spawnSync(`echo -n ${data2Save} > ${preDir}/dir/zh_CN.js`, { shell: true })
      // if (fs.mkdirSync(preDir + '/' + dir, { recursive: true })) {
      //   fs.writeFileSync(`${preDir}/${dir}/zh_CN.js`, data2Save)
        // spawn(`cat > ${dir}/zh_CN.js <<< EOF
        //   ${data2Save}
        // EOF`)
      // }
    },
  }
})

export default plugin
