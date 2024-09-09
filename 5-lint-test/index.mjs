import { transformFromAstSync } from '@babel/core'
import parser from '@babel/parser'
import plugin from './plugin/plugin.mjs'
import fs from 'node:fs'
import getDirname from '../utils/get-dirname.mjs'
import path from 'node:path'

const sourceCode = fs.readFileSync(path.join(
  getDirname(import.meta.url), './sourceCode.js'
), { encoding: 'utf-8' })


//console.log(parser)

//console.log(sourceCode)
const ast = parser.parse(sourceCode, { sourceType: 'module', plugins: ['jsx'] })

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[plugin, { autoFix: true, }]],
})
console.log(code)
