import { transformFromAstSync } from '@babel/core'
import parser from '@babel/parser'
import plugin from './plugin/auto-type-doc-plugin.mjs'
import fs from 'node:fs'
import path from 'node:path'

const sourceCode = fs.readFileSync('./4-auto-type-doc/sourceCode.ts', { encoding: 'utf-8' })


//console.log(parser)

//console.log(sourceCode)
const ast = parser.parse(sourceCode, { sourceType: 'module', plugins: ['jsx','typescript'] })

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[plugin, { outputDir: 'docs', format: 'json' }]],
})
console.log(code)
