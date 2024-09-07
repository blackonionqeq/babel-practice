import { transformFileSync } from '@babel/core'
import insertPlugin from './before-line-insert-plugin.js'
console.log(insertPlugin)
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// console.log(import.meta.url)
// console.log(fileURLToPath(import.meta.url))

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
)
// console.log(__dirname)

/** 注意为了模拟nodejs的__dirname，需要用标准库的工具函数做一下转换；
 * 另外，注意下面有两个plugins，一个是parser阶段用的，一个是traverse阶段用的，要区分开
 */
const { code } = transformFileSync(path.join(__dirname, './sourceCode.js'), {
  plugins: [insertPlugin],
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx'],
  },
})

console.log(code)
