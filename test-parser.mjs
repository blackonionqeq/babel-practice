import parser from '@babel/parser'

const ast = parser.parse("const a = 555; const b = <div>aaa</div>", {
	sourceType: 'unambiguous',
	plugins: ['jsx'],
})

//console.log(ast)
console.log(ast.program.body[1].declarations)
