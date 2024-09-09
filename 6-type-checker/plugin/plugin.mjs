// import { addDefault } from '@babel/helper-module-imports'
import { declare } from '@babel/helper-plugin-utils'

// console.log(addDefault)
// console.log(declare)
const tsTypeAnnotationMap = {
  'TSStringKeyword': 'string'
}
/**
 * @typedef {import('@babel/types')} type
 * @typedef {import('@babel/types').TSType} TSType
 */
/**
 * 
 * @param {TSType} tsType 
 */
function getDetailType(tsType, map) {
  switch (tsType.type) {
    case 'TSTypeReference': return map[tsType.typeName.name]
    case 'TSTypeAnnotation': {
      if (tsType.typeAnnotation.type === '') {
        return 
      }
      return tsTypeAnnotationMap[tsType.typeAnnotation.type]
    }
    case 'StringTypeAnnotation':
    case 'TSStringKeyword': return 'string'
    case 'NumberTypeAnnotation':
    case 'TSNumberKeyword': return 'number'
    case 'TSBooleanKeyword': return 'boolean'
  }
}

export const plugin = declare((api, options, dirname) => {
  // console.log(api, options, dirname)
  /**
 * @param {PluginPass} state
 * @param {NodePath} path 
 */
  function addError(state, path, errMsg) {
  
    const tmp = Error.stackTraceLimit
    Error.stackTraceLimit = 0
    // 注意要.file…又踩坑一次
    state.file.errors.push(
      // 上下文中有构建报错信息的api
      path.buildCodeFrameError(errMsg,  Error)
    )
    Error.stackTraceLimit = tmp
  }
  return {
    pre(file) {
      file.errors = []
    },
    visitor: {
      // 赋值时判断左右类型是否匹配
      AssignmentExpression(path, state) {
        const left = path.get('left')
        const name = left.node.name
        const right = path.get('right')
        const valueType = getDetailType(right.getTypeAnnotation())
        // console.log(left, right)
        const binding = left.scope.getBinding(name)
        console.log(binding)
        const definedType = getDetailType(binding.identifier.typeAnnotation)
        if (definedType !== valueType) {
          addError(state, path, `${valueType} can not assign to ${definedType}`)
        }
      },
      // 调用函数时判断实参是否和声明时类型一致
      // 以及含有泛型的情况
      CallExpression(path, state) {
        if (path.node.typeParameters?.params) {
          // 处理含有泛型的情况

          // 拿到泛型参数的实际类型，例如add2<number>(1,'2')中的number
          // 如果没有，理论上直接读调用参数的类型也行，但这里只做演示，省略这部分
          const genericRealTypes = path.node.typeParameters.params.map(i => getDetailType(i))
          // 发起调用的函数名
          const callee = path.node.callee.name
          const funcDeclarePath = path.scope.getBinding(callee).path
          const typeMaps = Object.create(null)
          // 因为有了泛型参数的实际类型，所以可以建立泛型:真实类型的映射表了
          funcDeclarePath.node.typeParameters.params.map((i, idx) => {
            typeMaps[i.name] = genericRealTypes[idx]
          })
          // 获得理论真实类型，用于对照传入的参数类型
          const declareRealParamsTypes = funcDeclarePath.get('params').map(i => getDetailType(i.getTypeAnnotation(), typeMaps))

          const args = path.get('arguments').map(i => getDetailType(i.getTypeAnnotation()))
          args.forEach((arg, i) => {
            if (arg !== declareRealParamsTypes[i]) {
              
              // 注意这里的第二个参数，这么写是为了获得更准确的报错信息，当然不这么用直接path也行
              addError(state, path.get(`arguments.${i}`), `${arg} can not assign to ${declareRealParamsTypes[i]}`)
            }
          })
        } else {
          // 处理普通情况
          const callee = path.get('callee').node.name
          const binding = path.scope.getBinding(callee)
          const definedParamsTypes = binding.path.get('params').map(param => getDetailType(param.getTypeAnnotation()))
  
          const args = path.get('arguments').map(param => getDetailType(param.getTypeAnnotation()))
  
          // console.log(definedParamsTypes)
          // console.log(args)
          args.forEach((arg, i) => {
            if (arg !== definedParamsTypes[i]) {
              // 注意这里的第二个参数，这么写是为了获得更准确的报错信息，当然不这么用直接path也行
              addError(state, path.get(`arguments.${i}`), `${arg} can not assign to ${definedParamsTypes[i]}`)
            }
          })
        }

      },
    },
    post(file) {
      console.log(file)
    },
  }
})

export default plugin
