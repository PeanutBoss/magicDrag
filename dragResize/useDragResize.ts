import { getElement, mergeObject, removeElements, baseErrorTips, insertAfter, checkParameterType } from "../utils/tools.ts";
import { onMounted, watch, onUnmounted, Ref } from 'vue'
import useMovePoint from "./useMovePoint.ts";
import {
  createParentPosition, blurOrFocus,
  updateTargetStyle, updatePointPosition, limitTargetResize, moveTargetCallback,
  pointIsPressChangeCallback, updateInitialTarget, initPointStyle, initTargetStyle
} from '../utils/dragResize.ts'
import type { Direction } from '../utils/dragResize.ts'

insertAfter()

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
// 默认配置
const defaultOptions: DragResizeOptions = {
  minWidth: 100, // minimum width - 最小宽度
  minHeight: 100, // minimum height - 最小高度
  pointSize: 10, // the size of the contour point - 轮廓点的大小
  pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
  skill: {
    resize: true, // whether the size adjustment is supported - 是否支持大小调整
    drag: true // whether to support dragging - 是否支持拖动
  },
  callbacks: {}
}

// default style for contour points - 轮廓点的默认样式
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
  // 检查 targetSelector 是否为选择器或 HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions, options)

  options = mergeObject(defaultOptions, options)
  const { minWidth, minHeight, pointSize, pageHasScrollBar, skill, callbacks } = options
  const { resize, drag } = skill
  const { dragCallback, resizeCallback } = callbacks

  // the target element being manipulated
  // 操作的目标元素
  let $target
  // coordinates and dimensions of the target element
  // 目标元素的坐标和尺寸
  const initialTarget = updateInitialTarget()
  // save contour point
  // 保存轮廓点
  const pointElements = {}
  const processBlurOrFocus = blurOrFocus(pointElements)

	onMounted(() => {
		initTarget()

    readyToDragAndResize($target, pointSize)
	})
  onUnmounted(() => {
    // unbind the mousedown event added for window to handle the target element
    //  解绑为 window 添加的 mousedown 事件以处理目标元素
    processBlurOrFocus($target, false)
    // the dom element is destroyed when the page is uninstalled
    // 页面卸载时销毁 dom 元素
    removeElements(Object.values(pointElements))
  })



  // initializes the target element
  // 初始化目标元素
  function initTarget () {
    $target = getElement(targetSelector)

    baseErrorTips(!$target, 'targetSelector is an invalid selector or HTMLElement')

    initTargetStyle($target, drag)

    initTargetCoordinate()
  }
  // initializes the target element coordinates
  // 初始化目标元素的坐标
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



  /**
   * @description ready to drag and resize - 准备拖动和调整大小
   * @param target
   * @param pointSize
   */
  function readyToDragAndResize (target: HTMLElement, pointSize: number) {
    moveTarget(target)

    whetherNeedResize(target, pointSize, resize)
  }
  // add drag and drop functionality for outline points - 为轮廓点添加拖放功能
  function addDragFunctionToPoint (target, { point, pointPosition, pointSize, direction }) {
    const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
      moveAction()
      movePointCallback(target, { direction, movementX, movementY, pointSize })
      resizeCallback?.(direction as Direction, { movementX: movementX.value, movementY: movementY.value })
    }, { direction: pointPosition[direction][3] })
    return isPress
  }
  // create contour points - 创建轮廓点
  function createContourPoint (target, { pointPosition, direction, pointSize }) {
    const parentNode = target.parentNode
    const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
    initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize }, pointDefaultStyle)
    parentNode.appendChild(point)
    return point
  }
  // initialize the contour point - 初始化轮廓点
  function initContourPoints (target, pointPosition, pointSize) {
    for (const direction in pointPosition) {
      const point = createContourPoint(target, { pointPosition, direction, pointSize })
      const isPress = addDragFunctionToPoint(target, { point, pointPosition, direction, pointSize })
      // update the width and height information when releasing the mouse
      // 当释放鼠标时更新宽度和高度信息
      watch(isPress, pointIsPressChangeCallback(target, initialTarget))
    }
  }
  // whether the resize function is required - 是否需要调整大小功能
  function whetherNeedResize (target, pointSize, resize) {
    if (!resize) return
    const pointPosition = createParentPosition(initialTarget, pointSize)
    initContourPoints(target, pointPosition, pointSize)
  }


  /**
   * @description a callback function that moves contour points - 移动轮廓点的回调函数
   * @param target
   * @param direction
   * @param movementX
   * @param movementY
   * @param pointSize
   */
  function movePointCallback (target, { direction, movementX, movementY, pointSize }) {

    limitTargetResize(target, { direction, movementX, movementY }, { initialTarget, minWidth, minHeight })

    updateTargetStyle(target, { direction, movementX, movementY }, { initialTarget })

    updatePointPosition(target, { direction, movementX, movementY, pointSize }, { initialTarget, pointElements })
  }



  /**
   * @description handles the drag and drop function of the target element - 处理目标元素的拖放函数
   * @param target
   */
  function moveTarget (target: HTMLElement) {
    // used to record the position information of each contour point when the target is pressed
    // 用于记录目标元素被按下时各个轮廓点的位置信息
    const downPointPosition = {}

    processBlurOrFocus(target)

    whetherNeedDragFunction(target, downPointPosition)
  }
  // A callback that is executed when isPress changes - isPress发生变化时执行的回调
  function isPressChangeCallback ({ downPointPosition, movementX, movementY }) {
    return (newV) => {
      if (newV) {
        // the coordinates of all contour points are recorded when the target element is pressed
        // 当按下目标元素时，记录所有轮廓点的坐标
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        // mouse up to update the coordinates of the target element
        // 鼠标抬起时更新目标元素的坐标
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    }
  }
  function whetherNeedDragFunction (target, downPointPosition) {
    if (!drag) return
    const { movementX, movementY, isPress } = useMovePoint(target, moveTargetCallback(downPointPosition, dragCallback, pointElements))
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
