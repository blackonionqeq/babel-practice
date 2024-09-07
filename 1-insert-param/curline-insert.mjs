//#! /usr/bin/env node
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

traverse.default(ast, {
	CallExpression(path, state) {
		const callee = path.get('callee')
		console.log(path.container)
		console.log(path.key)
		// ;
		// (() => {
		//     debugger
		//     callee.toString()
		// })()
//do something
//console.log('on call expression')
		//if (types.isMember) {}
		//console.log(path.node)
		if (types.isMemberExpression(path.node.callee) && path.node.callee.object.name === 'console') {
		console.log('on call')
			const { line, column } = path.node.loc.start
			path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
		}
	}
})

const {code, map} = generator.default(ast)
console.log(code)
