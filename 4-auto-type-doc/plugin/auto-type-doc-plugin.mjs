// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'
import doctrine from 'doctrine'
import renderer from './renderer/index.js'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

// console.log(addDefault)
// console.log(declare)
/**
 * 
 * @param {string} docs 
 * @param {'json'|'markdown'} format 
 * @returns 
 */
function generate(docs, format = 'json') {
  if (format === 'markdown') {
    return {
      ext: '.md',
      content: renderer.markdown(docs)
    }
  } else if (format === 'json') {
    return {
      ext: '.json',
      content: renderer.json(docs)
    }
  }
}

/**
 * @typedef {import('@babel/types')} type
 * @typedef {import('@babel/types').TSType} TSType
 * @typedef {import('@babel/types').TypeAnnotation} TA
 */

export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)
  function parseComment(comment) {
    if (!comment) return
    return doctrine.parse(comment, { unwrap: true, })
  }
  /**
   * 
   * @param {TSType} tsType 
   */
  function getDetailType(tsType) {
    const ta = tsType.typeAnnotation
    if (!ta) return
    ta
    switch (ta.type) {
      case 'TSStringKeyword': return 'string'
      case 'TSNumberKeyword': return 'number'
      case 'TSBooleanKeyword': return 'boolean'
    }
  }
  return {
    pre(file) {
      file.docs = []
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const funcType = {
          type: 'func',
          name: path.get('id').node.name,
          params: path.get('params').map(paramPath => ({
            name: paramPath.node.name,
            type: getDetailType(paramPath.node.typeAnnotation)
          })),
          // return: getDetailType(path.get('returnType').getTypeAnnotation()),
          doc: parseComment(path.node.leadingComments?.[0]?.value ?? '')
        }
        state.file.docs.push(funcType)
      },
      ClassDeclaration(path, state) {
        const classType = {
          type: 'class',
          name: path.get('id').node.name,
          constructorInfo: {},
          methodsInfo: [],
          propertiesInfo: [],
          doc: parseComment(path.node.leadingComments?.[0]?.value ?? '')
        }
        path.traverse({
          // method可能是构造器或方法，需要区分处理
          ClassMethod(path2) {
            if (path2.node.kind === 'constructor') {
              classType.constructorInfo = {
                params: path2.get('params').map(paramPath => ({
                  name: paramPath.node.name,
                  type: getDetailType(paramPath.node.typeAnnotation)
                }))
              }
            } else {
              classType.methodsInfo.push({
                name: path2.get('key').node.name,
                params: path2.get('params').map(paramPath => ({
                  name: paramPath.node.name,
                  type: getDetailType(paramPath.node.typeAnnotation)
                })),
                doc: parseComment(path2.node.leadingComments?.[0]?.value ?? ''),
                return: getDetailType(path2.node.returnType)
              })
            }
          },
          ClassProperty(path2) {
            classType.propertiesInfo.push({
              name: path2.get('key').node.name,
              type: getDetailType(path2.node.typeAnnotation),
              doc: [path.node.leadingComments?.[0], path.node.trailingComments?.[0]].filter(Boolean).map(comment => parseComment(comment.value)).filter(Boolean),
            })
          },
        })
        state.file.docs.push(classType)
      },
    },
    post(file) {
      // console.log(file.docs)
      const res = generate(file.docs, options.format)
      const dirname = path.dirname(
        url.fileURLToPath(import.meta.url)
      )
      const targetDir = path.join(dirname, options.outputDir ?? 'dist')
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      fs.writeFileSync(
        path.join(targetDir, 'docs' + res.ext),
        res.content,
      )
    },
  }
})

export default plugin
