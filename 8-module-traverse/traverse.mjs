import fs from 'node:fs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import path from 'node:path'
import {DependencyNode} from './DependencyNode.mjs'
import getDirname from '../utils/get-dirname.mjs'

const IMPORT_TYPE = {
	deconstruct: 'deconstruct',
	default: 'default',
	namespace: 'namespace'
}
const EXPORT_TYPE = {
	all: 'all',
	default: 'default',
	named: 'named'
}
/**
 * 
 * @param {string} modulePath 
 */
function resolvePlugins(modulePath) {
	const plugins = []
	if (['.jsx', '.tsx'].some(ext => modulePath.endsWith(ext))) plugins.push('jsx')
	if (['.ts', '.tsx'].some(ext => modulePath.endsWith(ext))) plugins.push('typescript')
	return plugins
}

/**
 * 
 * @param {string} targetPath 
 */
function checkPath(targetPath) {
	
	const exts = ['.js', '.jsx', '.ts', '.tsx']
	
	for (let i = 0; i < exts.length; i++) {
		const tryPath = (targetPath + exts[i])
		if (fs.existsSync(tryPath)) {
			return tryPath
		}
	}
	return false
}
/**
 * 
 * @param {string} requiredPath 
 * @param {string} curPath 
 */
function resolveModulePath(requiredPath, curPath) {
	// 先完善路径，再增加扩展名后判断文件是否存在

	let dir = requiredPath
	// 不是绝对路径时启用相对路径的组合判断
	if (!fs.existsSync(dir)) {
		dir = path.resolve(path.dirname(curPath), requiredPath)
	}
	// 如果文件包含扩展名，直接返回完整文件名
	if (dir.match(/\.\w+$/)) return dir
	// const exts = ['.js', '.jsx', '.ts', '.tsx']
	// 判断本身就是文件名，只是没加扩展名
	const isFilePath = checkPath(dir)
	if (isFilePath) return isFilePath
	// 否则假设是文件夹，加index再加扩展名，再判断
	dir = path.join(dir, 'index')
	const isFolderPath = checkPath(dir)
	if (isFolderPath) return isFolderPath
	throw new Error('找不到文件', curPath, requiredPath)
}

/**
 * 
 * @param {*} curModulePath 
 * @param {DependencyNode} graphNode 
 * @param {*} allModules 
 */
export function traverseModule(curModulePath = '', graphNode, allModules) {
	const file = fs.readFileSync(curModulePath, { encoding: 'utf-8' })
	graphNode.path = curModulePath

	const ast = parser.parse(file, {
		sourceType: 'module',
		plugins: resolvePlugins(curModulePath)
	})

	traverse.default(ast, {
		ImportDeclaration(path, state) {
			// 这种我们叫 deconstruct import（解构引入）
			// import { a, b as bb} from 'aa';
			// 这种我们叫 namespace import（命名空间引入）
			// import * as c from 'cc';
			// 这种我们叫 default import（默认引入）
			// import b from 'b';

			const tmpPath = path.get('source').node.value
			const subModulePath = resolveModulePath(tmpPath, curModulePath)
			if (!subModulePath) return
			graphNode.imports[subModulePath] = path.get('specifiers').map(specifierPath => {
				if (specifierPath.isImportSpecifier()) {
					return {
						type: IMPORT_TYPE.deconstruct,
						imported: specifierPath.node.imported.name,
						local: specifierPath.node.local.name,
					}
				} else if (specifierPath.isImportNamespaceSpecifier()) {
					return {
						type: IMPORT_TYPE.namespace,
						local: specifierPath.node.local.name,
					}
				} else if (specifierPath.isImportDefaultSpecifier()) {
					return {
						type: IMPORT_TYPE.default,
						local: specifierPath.node.local.name,
					}
				}
			})
			const subModule = new DependencyNode
			// 深度优先递归
			traverseModule(subModulePath, subModule, allModules)
			// 写进节点关系图中，前面只处理了子模块
			graphNode.subModules[subModule.path] = subModule
		},
		ExportDeclaration(path, state) {
			// 全部导出(all export)
			// export * from 'a';
			// 默认导出 (default export)
			// export default b;
			// 命名导出 (named export)
			// export { c as cc };
			if (path.isExportNamedDeclaration()) {
				graphNode.exports = path.get('specifiers').map(spPath => ({
					type: EXPORT_TYPE.named,
					exported: spPath.get('exported').node.name,
					local: spPath.get('local').node.name,
				}))
			} else if (path.isExportDefaultDeclaration()) {
				// 默认导出分两种情况，还要看是否是表达式，如
				// export default const a = 2
				// export default b
				const declarePath = path.get('declaration')
				let exportName = declarePath.isAssignmentExpression() ? 
					declarePath.get('left').node.name : 
					declarePath.node.name
				graphNode.exports.push({
					type: EXPORT_TYPE.default,
					exported: exportName,
				})
			} else if (path.isExportAllDeclaration()) {
				graphNode.exports.push({
					type: EXPORT_TYPE.all,
					exported: path.get('exported').node.name,
					source: path.get('source').node.name,
				})
			}
		},
	})
	allModules[curModulePath] = graphNode
}

export default traverseModule