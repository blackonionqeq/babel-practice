export class DependencyNode {
	/**
	 * 
	 * @param {*} path 
	 * @param {*} imports 
	 * @param {Array<Object>} exports 
	 */
	constructor(path = '', imports = {}, exports = []) {
		this.path = path
		// imports之所以是对象，是因为
		this.imports = imports
		this.subModules = {}
		this.exports = exports
	}
}

// let a = new DependencyNode
// a.subModules

export default DependencyNode