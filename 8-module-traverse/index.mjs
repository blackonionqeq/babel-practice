// 用babel递归遍历traverse-target模块，获得文件的Imports、exports，在subModules中存放imports子模块的详情
// 获得imports时继续沿着引用递归（深度优先）
// 最终得到模块依赖图

import getDirname from "../utils/get-dirname.mjs";
import DependencyNode from "./DependencyNode.mjs";
import traverseModule from "./traverse.mjs";
import path from 'node:path'

const rootPath = path.resolve(
	getDirname(import.meta.url),
	'./traverse-target'
) 

// 节点图包括两部分，一个是从入口开始的树结构，一个是打平的所有模块
const graph = {
	root: new DependencyNode,
	allModules: {}
}
traverseModule(
	path.join(rootPath, 'index.js'),
	graph.root,
	graph.allModules,
)
console.log(
	JSON.stringify(graph, null, 2)
)
// DependencyNode