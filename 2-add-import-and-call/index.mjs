import { transformFromAstSync } from '@babel/core'
import parser from '@babel/parser'
import plugin from './plugin/auto-import-and-call-plugin.mjs'
import fs from 'node:fs'
import path from 'node:path'

const sourceCode = fs.readFileSync('./2-add-import-and-call/sourceCode.js', { encoding: 'utf-8' })


//console.log(parser)

//console.log(sourceCode)
const ast = parser.parse(sourceCode, { sourceType: 'module' })

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[plugin, { trackerPath: 'tracker' }]],
})
console.log(code)
