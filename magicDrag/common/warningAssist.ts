
// check that the type of options passed in is correct
// 检查传入的选项类型是否正确
import {baseErrorTips, baseWarnTips, isNullOrUndefined} from '../utils/tools'
import {MagicDragOptions} from './globalData'

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
  checkCustomStyle(options.customStyle)
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
function checkCustomStyle(styles: MagicDragOptions['customStyle']) {
  checkPointStyle(styles.pointStyle)
  checkRefLineStyle(styles.refLineStyle)
  checkTipStyle(styles.tipStyle)
  function checkPointStyle(pointStyle: MagicDragOptions['customStyle']['pointStyle']) {
    const unitRight = pointStyle?.width && !/^\d+px$/.test(pointStyle.width)
      || pointStyle?.height && !/^\d+px$/.test(pointStyle.height)
    baseErrorTips(unitRight,
      'The dimensions of the outline points are supported only in px units')
    baseErrorTips(pointStyle?.position && pointStyle.position !== 'absolute',
      'Contour points must have absolute positioning turned on')
    baseWarnTips(pointStyle?.display && pointStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete`)
    baseWarnTips(pointStyle?.boxSizing && pointStyle.boxSizing !== 'border-box',
      'If the contour point box-sizing property is not set to border-box, the contour point position may be shifted')
  }
  function checkRefLineStyle(refLineStyle: MagicDragOptions['customStyle']['refLineStyle']) {
    baseErrorTips(!isNullOrUndefined(refLineStyle?.width) || !isNullOrUndefined(refLineStyle?.height),
      'Setting the guide size is not supported')
    baseErrorTips(refLineStyle?.position && refLineStyle.position !== 'absolute',
      'Contour points must have absolute positioning turned on')
    baseWarnTips(refLineStyle?.display && refLineStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete`)
  }
  function checkTipStyle(tipStyle: MagicDragOptions['customStyle']['tipStyle']) {
    baseErrorTips(tipStyle?.position && tipStyle.position !== 'absolute',
      'Contour points must have absolute positioning turned on')
    baseWarnTips(tipStyle?.display && tipStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete`)
    baseWarnTips(tipStyle?.boxSizing && tipStyle.boxSizing !== 'border-box',
      'If the contour point box-sizing property is not set to border-box, the contour point position may be shifted')
  }
}
