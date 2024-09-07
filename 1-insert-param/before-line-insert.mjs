//#! /usr/bin/env node
import template from '@babel/template'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'
import types from '@babel/types'

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`


const ast = parser.parse(sourceCode, {
	sourceType: 'unambiguous',
  plugins: ['jsx']
})

const targetColleeName = ['log','info','error','debug'].map(i => `console.${i}`);
// console.log(traverse)
// console.log('default' in traverse)
traverse.default(ast, {
	CallExpression(path, state) {
    // 分两种情况，是jsx的情况和不是的情况
    // 共同内容：判断是不是console.xxx方法
    // 注意！template.expression后还有一次调用
    if (path.node.isNew) return
    const calleeName = path.get('callee').toString()
    console.log(calleeName)
    if (targetColleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start
      const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)()
      newNode.isNew = true
      console.log(newNode)

      if (path.findParent(p => p.isJSXElement())) {
        path.replaceWith(types.arrayExpression([newNode, path.node]))
        path.skip()
      } else {
        path.insertBefore(newNode)
      }
    }
  }
	
})

const {code, map} = generator.default(ast)
console.log(code)
