import { transformFromAstSync } from '@babel/core'
import parser from '@babel/parser'
import plugin from './plugin/auto-intl.mjs'
import fs from 'node:fs'
import path from 'node:path'

const sourceCode = fs.readFileSync('./3-auto-intl/sourceCode.js', { encoding: 'utf-8' })


//console.log(parser)

//console.log(sourceCode)
const ast = parser.parse(sourceCode, { sourceType: 'module', plugins: ['jsx'] })

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[plugin, { intlPath: 'intl', intlDefaultName: 'intlObj', intlIdxKey: 'key', outputDir: 'dist' }]],
})
console.log(code)
