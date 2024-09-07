// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'

// console.log(addDefault)
// console.log(declare)

export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)
  return {}
})

export default plugin
