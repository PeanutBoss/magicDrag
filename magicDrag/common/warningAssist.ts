
// check that the type of options passed in is correct
// 检查传入的选项类型是否正确
import { baseErrorTips, baseWarnTips, isNullOrUndefined } from '../utils/tools'
import { MagicDragOptions } from './globalData'

export function checkParameterType (defaultOptions, options = {}) {
  for (const key in defaultOptions) {
    const value = options[key]
    if (isNullOrUndefined(value)) continue
    const originType = Array.isArray(defaultOptions[key]) ? 'array' : typeof defaultOptions[key]
    const paramsType = Array.isArray(value) ? 'array' :  typeof value
    baseErrorTips(
      originType !== paramsType,
      `The type of options.${key} should be ${originType}, But the ${paramsType} type is passed in.`
    )
  }
}

// Check that the options passed in are valid
// 检查传入的选项是否合法
export function checkParameterValue(options: MagicDragOptions) {
  checkOptionPosition(options?.initialInfo)
  checkOptionSize(options)
  checkCustomStyle(options?.customStyle)
}
export function checkOptionSize(options: Partial<MagicDragOptions> = {}) {
  baseWarnTips(errorSize(),'The maximum value cannot be less than the minimum value, and the maximum and minimum values have been replaced with each other.')
  // 最大最小值无效时替换最大最小值
  fixMaxAndMin()
  baseWarnTips(lessThanMinimumH() && lessThanMinimumW(), 'The initial size cannot be less than the minimum size.')
  baseWarnTips(greaterThanMaximumH() && greaterThanMaximumW(), 'The initial size cannot be greater than the maximum size.')
  function lessThanMinimumH() {
    return options?.initialInfo?.height && options.minHeight && (options.initialInfo.height < options.minHeight)
  }
  function lessThanMinimumW() {
    return options?.initialInfo?.width && options.minWidth &&  (options.initialInfo.width < options.minWidth)
  }
  function greaterThanMaximumH() {
    return options?.initialInfo?.height && options.maxHeight && (options.initialInfo.height > options.maxHeight)
  }
  function greaterThanMaximumW() {
    return options?.initialInfo?.width && options.maxWidth && (options.initialInfo.width > options.maxWidth)
  }
  function errorSize() {
    return options.minWidth > options.maxWidth || options.minHeight > options.maxHeight
  }
  function fixMaxAndMin() {
    const { minWidth, maxWidth, minHeight, maxHeight } = options
    if (minWidth > maxWidth) {
      options.minWidth = maxWidth
      options.maxWidth = minWidth
    }
    if (minHeight > maxHeight) {
      options.minHeight = maxHeight
      options.maxHeight = minHeight
    }
  }
}
function checkOptionPosition(initialInfo: MagicDragOptions['initialInfo']) {
  if (!initialInfo) return
  baseWarnTips(posBeNegative(), 'It is not recommended that the initial location information be set to a negative value.')
  fixInitialPos()
  function fixInitialPos() {
    initialInfo.top = initialInfo.top > 0 ? initialInfo.top : 0
    initialInfo.left = initialInfo.left > 0 ? initialInfo.left : 0
  }

  fixInitialPos()
  function posBeNegative() {
    return initialInfo.left < 0 || initialInfo.top < 0
  }
}
function checkCustomStyle(styles: MagicDragOptions['customStyle']) {
  if (!styles) return
  checkPointStyle(styles.pointStyle)
  fixPointStyle(styles.pointStyle)
  checkRefLineStyle(styles.refLineStyle)
  fixRefLineStyle(styles.refLineStyle)
  checkTipStyle(styles.tipStyle)
  fixTipStyle(styles.tipStyle)
  function checkPointStyle(pointStyle: MagicDragOptions['customStyle']['pointStyle']) {
    if (!pointStyle) return
    const unitError = pointStyle?.width && !/^\d+px$/.test(pointStyle.width)
      || pointStyle?.height && !/^\d+px$/.test(pointStyle.height)
    baseErrorTips(unitError,
      'The dimensions of the outline points are supported only in px units.')
    baseWarnTips(pointStyle?.position && pointStyle.position !== 'absolute',
      'PointStyle.position the expected value is absolute and is automatically modified.')
    baseWarnTips(pointStyle?.display && pointStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
    baseWarnTips(pointStyle?.boxSizing && pointStyle.boxSizing !== 'border-box',
      'If the contour point box-sizing property is not set to border-box, the contour point position may be shifted.')
  }
  function checkRefLineStyle(refLineStyle: MagicDragOptions['customStyle']['refLineStyle']) {
    baseWarnTips(!isNullOrUndefined(refLineStyle?.width) || !isNullOrUndefined(refLineStyle?.height),
      'The guide size cannot be set. It has been moved and deleted.')
    baseWarnTips(refLineStyle?.position && refLineStyle.position !== 'absolute',
      'RefLineStyle.position the expected value is absolute and is automatically modified.')
    baseWarnTips(refLineStyle?.display && refLineStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
  }
  function checkTipStyle(tipStyle: MagicDragOptions['customStyle']['tipStyle']) {
    baseWarnTips(tipStyle?.position && tipStyle.position !== 'absolute',
      'TipStyle.position the expected value is absolute and is automatically modified.')
    baseWarnTips(tipStyle?.display && tipStyle.display !== 'none',
      `If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
    baseWarnTips(tipStyle?.boxSizing && tipStyle.boxSizing !== 'border-box',
      'If the contour point box-sizing property is not set to border-box, the contour point position may be shifted.')
  }
  function fixPointStyle(pointStyle: MagicDragOptions['customStyle']['pointStyle']) {
    if (!pointStyle) return
    if (pointStyle?.position) pointStyle.position = 'absolute'
    if (pointStyle?.display) pointStyle.display = 'none'
    if (pointStyle?.boxSizing) pointStyle.boxSizing = 'border-box'
  }
  function fixRefLineStyle(refLineStyle: MagicDragOptions['customStyle']['refLineStyle']) {
    if (!refLineStyle) return
    if (refLineStyle?.width) delete refLineStyle.width
    if (refLineStyle?.height) delete refLineStyle.height
    if (refLineStyle?.position) refLineStyle.position = 'absolute'
    if (refLineStyle?.display) refLineStyle.display = 'none'
  }
  function fixTipStyle(tipStyle: MagicDragOptions['customStyle']['tipStyle']) {
    if (!tipStyle) return
    if (tipStyle?.position) tipStyle.position = 'absolute'
    if (tipStyle?.display) tipStyle.display = 'none'
    if (tipStyle?.boxSizing) tipStyle.boxSizing = 'border-box'
  }
}
