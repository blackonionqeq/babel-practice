// 文件名必须是.mjs，不然nodejs似乎找不到…
import url from 'node:url'
import path from 'node:path'

/**
 * @param {string} fileUrl
 * @return {string}
 */
export function getDirname(fileUrl) {
	return path.dirname(url.fileURLToPath(fileUrl))
}
export default getDirname