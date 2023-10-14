
// check that the type of options passed in is correct
// 检查传入的选项类型是否正确
import {baseErrorTips, baseWarnTips, isNullOrUndefined} from '../utils/tools'
import {MagicDragOptions} from './magicDragAssist'

export function checkParameterType (defaultOptions, options = {}) {
  for (const key in defaultOptions) {
    const value = options[key]
    if (isNullOrUndefined(value)) continue
    const originType = typeof defaultOptions[key]
    const paramsType = typeof value
    baseErrorTips(
      originType !== paramsType,
      `The type of options.${key} should be ${originType}, But the ${paramsType} type is passed in.`
    )
  }
}

// Check that the options passed in are valid
// 检查传入的选项是否合法
export function checkParameterValue(options: MagicDragOptions) {
  checkOptionPosition(options.initialInfo)
  checkOptionSize(options)
}
function checkOptionSize(options: MagicDragOptions) {
  baseErrorTips(errorSize(), 'The minimum cannot be greater than the maximum')
  baseWarnTips(lessThanMinimum(), 'The initial size cannot be less than the minimum size')
  baseWarnTips(greaterThanMaximum(), 'The initial size cannot be greater than the maximum size')
  function lessThanMinimum() {
    return options.initialInfo.height < options.minHeight || options.initialInfo.width < options.minWidth
  }
  function greaterThanMaximum() {
    return options.initialInfo.height > options.maxHeight || options.initialInfo.width > options.maxWidth
  }
  function errorSize() {
    return options.minWidth > options.maxWidth || options.minHeight > options.maxHeight
  }
}
function checkOptionPosition(initialInfo: MagicDragOptions['initialInfo']) {
  baseWarnTips(posBeNegative(), 'It is not recommended that the initial location information be set to a negative value')

  function posBeNegative() {
    return initialInfo.left < 0 || initialInfo.top < 0
  }
}
