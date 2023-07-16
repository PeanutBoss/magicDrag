import { getElement, isNullOrUndefined, mergeObject, removeElements, baseErrorTips, insertAfter, EXECUTE_NEXT_TASK } from "../utils/tools.ts";
import { onMounted, reactive, watch, onUnmounted, Ref } from 'vue'
import useMovePoint from "./useMovePoint.ts";
import { createCoordinateStrategies, createParamStrategies, createResizeLimitStrategies, setPosition, createParentPosition } from '../utils/dragResize.ts'
import type { Direction, PointPosition } from '../utils/dragResize.ts'

insertAfter()

// 移动不同轮廓点的策略 可以优化为获取样式信息的策略
const pointStrategies = createCoordinateStrategies()

const paramStrategies = createParamStrategies()

function setStyle (target: HTMLElement, styleKey: string | object, styleValue?: string) {
  if (typeof styleKey === 'object') {
    const keys = Object.keys(styleKey)
    keys.forEach(key => {
      target.style[key] = styleKey[key]
    })
    return
  }
  target.style[styleKey] = styleValue
}

interface InitPointOption {
  pointPosition: PointPosition
  direction: Direction
  pointSize: number
}
// initializes the style of the contour points
function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption) {
  setStyle(point, pointDefaultStyle)
  setStyle(point, 'width', pointSize + 'px')
  setStyle(point, 'height', pointSize + 'px')
  setStyle(point, 'cursor', pointPosition[direction][2])
  setPosition(point, pointPosition, direction)
}

// creates/updates objects that record coordinate and dimension information for target elements
function updateInitialTarget (targetCoordinate?, newCoordinate?) {
  if (targetCoordinate && newCoordinate) {
    for (const key in targetCoordinate) {
      targetCoordinate[key] = newCoordinate[key]
    }
  }
  return reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })
}

// check that the type of options passed in is correct
function checkParameterType (defaultOptions, options) {
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

// get coordinates and size information based on dom elements
function getCoordinateByElement (element: HTMLElement) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop
  }
}

interface DragResizeOptions {
  minWidth?: number
  minHeight?: number
  pointSize?: number
  pageHasScrollBar?: boolean
  skill?: {
    resize?: boolean
    drag?: boolean
    limitRatio?: [number, number]
  },
  callbacks?: {
    dragCallback?: (movement: { movementX: number, movementY: number }) => void
    resizeCallback?: (direction: Direction, movement: { movementX: number, movementY: number } ) => void
  }
}
// default configuration
const defaultOptions: DragResizeOptions = {
  minWidth: 100, // minimum width
  minHeight: 100, // minimum height
  pointSize: 10, // the size of the contour point
  pageHasScrollBar: false, // whether the page has a scroll bar
  skill: {
    resize: true, // whether the size adjustment is supported
    drag: true // whether to support dragging
  },
  callbacks: {}
}

// default style for contour points
const pointDefaultStyle: { [key: string]: string } = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #999',
  borderRadius: '50%',
  display: 'none',
  zIndex: '999'
}

interface DragResizeState {
  targetIsPress: Ref<boolean>
  targetCanIMove: Ref<{ x: boolean, y: boolean }>
  targetMovement: { movementX: Ref<number>, movementY: Ref<number> }
  targetCoordinate: {
    left: Ref<number>
    top: Ref<number>
    width: Ref<number>
    height: Ref<number>
  }
}

export default function useDragResize (targetSelector: string | HTMLElement, options?: DragResizeOptions) {
  // check whether targetSelector is a selector or an HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions, options)

  options = mergeObject(defaultOptions, options)
  const { minWidth, minHeight, pointSize, pageHasScrollBar, skill, callbacks } = options
  const { resize, drag } = skill
  const { dragCallback, resizeCallback } = callbacks

  // the target element being manipulated
  let $target
  // coordinates and dimensions of the target element
  const initialTarget = updateInitialTarget()
  // save contour point
  const pointElements = {}

	onMounted(() => {
		initTarget()

    readyToDragAndResize($target, pointSize)
	})
  onUnmounted(() => {
    // unbind the mousedown event added for window to handle the target element
    processBlurOrFocus($target, false)
    // the dom element is destroyed when the page is uninstalled
    removeElements(Object.values(pointElements))
  })



  // initializes the target element
  function initTarget () {
    $target = getElement(targetSelector)

    baseErrorTips(!$target, 'targetSelector is an invalid selector or HTMLElement')

    initTargetStyle()

    initTargetCoordinate()
  }
  // initializes the target element coordinates
  function initTargetCoordinate () {
    const { left, top, height, width } = $target.getBoundingClientRect()
    const rect = {
      left: pageHasScrollBar ? left + window.scrollX : left,
      top: pageHasScrollBar ? top + window.scrollY : top,
      height,
      width
    }
    for (const rectKey in initialTarget) {
      initialTarget[rectKey] = rect[rectKey]
    }
  }
  function initTargetStyle () {
    // ensure element absolute positioning
    setStyle($target, 'position', 'absolute')
    // modify the icon for the hover state
    drag && setStyle($target, 'cursor', 'all-scroll')
  }



  /**
   * @description ready to drag and resize
   * @param target
   * @param pointSize
   */
  function readyToDragAndResize (target: HTMLElement, pointSize: number) {
    moveTarget(target)

    whetherNeedResize(target)
  }
  function pointIsPressChangeCallback (target) {
    return newV => {
      if (!newV) {
        updateInitialTarget(initialTarget, getCoordinateByElement(target))
      }
    }
  }
  // add drag and drop functionality for outline points
  function addDragFunctionToPoint (target, { point, pointPosition, pointSize, direction }) {
    const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
      moveAction()
      movePointCallback({ target, direction, movementX, movementY, pointSize })
      resizeCallback?.(direction as Direction, { movementX: movementX.value, movementY: movementY.value })
    }, { direction: pointPosition[direction][3] })
    return isPress
  }
  // create contour points
  function createContourPoint (target, { pointPosition, direction }) {
    const parentNode = target.parentNode
    const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
    initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize })
    parentNode.appendChild(point)
    return point
  }
  // initialize the contour point
  function initContourPoints (target, pointPosition) {
    for (const direction in pointPosition) {
      const point = createContourPoint(target, { pointPosition, direction })
      const isPress = addDragFunctionToPoint(target, { point, pointPosition, direction, pointSize })
      // update the width and height information when releasing the mouse
      watch(isPress, pointIsPressChangeCallback(target))
    }
  }
  // whether the resize function is required
  function whetherNeedResize (target) {
    if (!resize) return
    const pointPosition = createParentPosition(initialTarget, pointSize)
    initContourPoints(target, pointPosition)
  }


  /**
   * @description a callback function that moves contour points
   * @param target
   * @param direction
   * @param movementX
   * @param movementY
   * @param pointSize
   */
  function movePointCallback ({ target, direction, movementX, movementY, pointSize }) {

    limitTargetResize(target, { direction, movementX, movementY })

    updateTargetStyle(target, { direction, movementX, movementY })

    updatePointPosition(target, { direction, movementX, movementY, pointSize })
  }
  // a policy to limit the minimum size when resizing a target
  const resizeLimitStrategies = createResizeLimitStrategies(initialTarget, minWidth, minHeight)
  // limits the minimum size of the target element
  function limitTargetResize (target, { direction, movementX, movementY }) {
    resizeLimitStrategies[direction]({ movementX, movementY })
    return EXECUTE_NEXT_TASK
  }
  // updates the coordinates and dimensions of the target element
  function updateTargetStyle (target, { direction, movementX, movementY }) {
    const styleData = pointStrategies[direction]({
      left: initialTarget.left,
      top: initialTarget.top,
      width: initialTarget.width,
      height: initialTarget.height,
      offsetX: movementX.value,
      offsetY: movementY.value
    })
    setStyle(target, styleData)
    return EXECUTE_NEXT_TASK
  }
  // Obtain the latest coordinate and dimension information of target.
  // Different strategies are used to calculate coordinates at different points
  // Finally, the position of the contour points is set according to the new coordinate information
  function updatePointPosition (target, { direction, movementX, movementY, pointSize }) {
    // 获取 target 最新坐标和尺寸信息，按下不同点时计算坐标和尺寸的策略不同
    const coordinate = paramStrategies[direction]({ ...initialTarget, movementX, movementY })
    // 根据新的坐标和尺寸信息设置轮廓点的位置
    const pointPosition = createParentPosition(coordinate, pointSize)
    for (const innerDirection in pointPosition) {
      // 不需要更新当前拖拽的点
      if (innerDirection === direction) continue
      // 设置 innerDirection 对应点的位置信息
      setPosition(pointElements[innerDirection], pointPosition, innerDirection as Direction)
    }
  }



  /**
   * @description handles the drag and drop function of the target element
   * @param target
   */
  function moveTarget (target: HTMLElement) {
    const downPointPosition = {}

    processBlurOrFocus(target)

    whetherNeedDragFunction(target, downPointPosition)
  }
  function showOrHideContourPoint (pointElements, isShow) {
    for (const key in pointElements) {
      setStyle(pointElements[key], 'display', isShow ? 'block' : 'none')
    }
  }
  function checkIsContains (target, event) {
    const blurElements = [target, ...Object.values(pointElements)]
    if (!blurElements.includes(event.target)) {
      // losing focus hides outline points
      showOrHideContourPoint(pointElements, false)
    } else {
      // outline points are displayed when in focus
      showOrHideContourPoint(pointElements, true)
    }
  }
  // control the focus and out-of-focus display of the target element's outline points
  function blurOrFocus () {
    let checkIsContainsTarget
    return (target: HTMLElement, isBind = true) => {
      if (isBind) {
        window.addEventListener('mousedown', checkIsContainsTarget ?? (checkIsContainsTarget = checkIsContains.bind(null, target)))
      } else {
        window.removeEventListener('mousedown', checkIsContainsTarget)
      }
    }
  }
  const processBlurOrFocus = blurOrFocus()
  // update the position of the contour points
  function updateContourPointPosition (downPointPosition, movement) {
    for (const key in pointElements) {
      setStyle(pointElements[key], 'left', downPointPosition[key][0] + movement.x + 'px')
      setStyle(pointElements[key], 'top', downPointPosition[key][1] + movement.y + 'px')
    }
  }
  function moveTargetCallback (downPointPosition) {
    return (moveAction, movement) => {
      // perform the default action for movePoint
      moveAction()
      // update the position of the contour points
      updateContourPointPosition(downPointPosition, movement)
      // perform user-defined operations
      dragCallback?.({ movementX: movement.x, movementY: movement.y })
    }
  }
  function isPressChangeCallback ({ downPointPosition, movementX, movementY }) {
    return (newV) => {
      if (newV) {
        // the coordinates of all contour points are recorded when the target element is pressed
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        // mouse up to update the coordinates of the target element
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    }
  }
  function whetherNeedDragFunction (target, downPointPosition) {
    if (!drag) return
    // used to record the position information of each contour point when the target is pressed
    const { movementX, movementY, isPress } = useMovePoint(target, moveTargetCallback(downPointPosition))
    watch(isPress, isPressChangeCallback({ downPointPosition, movementX, movementY }))
  }

  return {
    // targetIsPress: targetMoveInfo.isPress,
    // targetCanIMove: targetMoveInfo.canIMove,
    // targetMovement: {
    //   movementX: targetMoveInfo.movementX,
    //   movementY: targetMoveInfo.movementY
    // },
    // targetCoordinate: {
    //   left: targetMoveInfo.left,
    //   top: targetMoveInfo.top,
    //   width: ref(targetMoveInfo.movementX + initialTarget.width),
    //   height: ref(targetMoveInfo.movementY + initialTarget.height)
    // }
  }
}
