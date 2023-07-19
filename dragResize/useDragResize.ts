import { getElement, mergeObject, removeElements, baseErrorTips, insertAfter,
  checkParameterType, transferControl, appendChild } from '../utils/tools.ts'
import {onMounted, watch, onUnmounted, Ref, reactive, toRef} from 'vue'
import useMovePoint from './useMovePoint.ts'
import {
  createParentPosition, blurOrFocus,
  updateTargetStyle, updatePointPosition, limitTargetResize, moveTargetCallback,
  pointIsPressChangeCallback, updateInitialTarget, initPointStyle, initTargetStyle,
  updateState
} from '../utils/dragResize.ts'
import type { Direction } from '../utils/dragResize.ts'

insertAfter()

interface DragResizeOptions {
  containerSelector: string
  minWidth?: number
  minHeight?: number
  pointSize?: number
  pageHasScrollBar?: boolean
  containerRange?: {
    left?: number
    top?: number
    width?: number
    height?: number
    bottom?: number
    right?: number
  }
  skill?: {
    resize?: boolean
    drag?: boolean
    limitRatio?: [number, number]
    limitDragDirection?: 'X' | 'Y' | null
  },
  callbacks?: {
    dragCallback?: (moveTargetAction: () => void, movement: { movementX: number, movementY: number }) => void
    resizeCallback?: (moveResizeAction: () => void, direction: Direction, movement: { movementX: number, movementY: number } ) => void
  }
}
// default configuration
// 默认配置
const defaultOptions: DragResizeOptions = {
  containerSelector: '',
  minWidth: 100, // minimum width - 最小宽度
  minHeight: 100, // minimum height - 最小高度
  pointSize: 10, // the size of the contour point - 轮廓点的大小
  pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
  skill: {
    resize: true, // whether the size adjustment is supported - 是否支持大小调整
    drag: true, // whether to support dragging - 是否支持拖动
    limitDragDirection: null // restricted direction of movement - 限制移动方向
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
  targetLeft: Ref<number>
  targetTop: Ref<number>
  targetWidth: Ref<number>
  targetHeight: Ref<number>
  pointLeft: Ref<number>
  pointTop: Ref<number>
  pointMovementX: Ref<number>
  pointMovementY: Ref<number>
  targetIsPress: Ref<boolean>
  pointIsPress: Ref<boolean>
  direction: Ref<string | null>
}

export default function useDragResize (targetSelector: string | HTMLElement, options?: DragResizeOptions): DragResizeState {
  // check whether targetSelector is a selector or an HTMLElement
  // 检查 targetSelector 是否为选择器或 HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions, options)

  options = mergeObject(defaultOptions, options)
  const { containerSelector, minWidth, minHeight, pointSize, skill, callbacks } = options
  const { resize, drag, limitDragDirection } = skill
  const { dragCallback, resizeCallback } = callbacks
  // the target element being manipulated
  // 操作的目标元素和容器元素
  let $target, $container
  // coordinates and dimensions of the target element - 目标元素的坐标和尺寸
  const initialTarget = updateInitialTarget()
  // save contour point - 保存轮廓点
  const pointElements = {}
  // 容器元素的坐标信息
  let containerInfo = {}
  // It is used to record the position information of each contour point when the target element is pressed
  // 用于记录目标元素被按下时各个轮廓点的位置信息
  const downPointPosition = {}
  // 显示或隐藏轮廓点的方法
  const processBlurOrFocus = blurOrFocus(pointElements)
  // 目标元素的状态
  const targetState = reactive({
    left: 0,
    top: 0,
    height: 0,
    width: 0,
    isPress: false
  })
  // 轮廓点的状态
  const pointState = reactive({
    left: 0,
    top: 0,
    direction: null,
    isPress: false,
    movementX: 0,
    movementY: 0
  })

	onMounted(() => {
    $container = getElement(containerSelector)
    containerInfo = $container.getBoundingClientRect() // scrollChange时会发生变化

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

    // 初始化结束后更新状态
    updateState(targetState, initialTarget)
  }
  // initializes the target element coordinates
  // 初始化目标元素的坐标
  function initTargetCoordinate () {
    // const { left, top, height, width } = $target.getBoundingClientRect()
    // const rect = {
    //   left: pageHasScrollBar ? left + window.scrollX : left,
    //   top: pageHasScrollBar ? top + window.scrollY : top,
    //   height,
    //   width
    // }
    // 直接获取相对于父元素的坐标
    const rect = {
      left: $target.offsetLeft,
      top: $target.offsetTop,
      width: $target.offsetWidth,
      height: $target.offsetHeight
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
  // used to record the position information of each contour point when the target is pressed
  function readyToDragAndResize (target: HTMLElement, pointSize: number) {
    whetherNeedDragFunction(target, downPointPosition)

    whetherNeedResizeFunction(target, pointSize, resize)
  }
  // add drag and drop functionality for outline points - 为轮廓点添加拖放功能
  function addDragFunctionToPoint (target, { point, pointPosition, pointSize, direction }) {
    const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
      const moveResizeAction = () => {
        moveAction()
        movePointCallback(target, { direction, movementX, movementY, pointSize })
      }
      // Hand over control (moveResizeAction)
      // 将控制权（moveResizeAction）交出
      transferControl(moveResizeAction, resizeCallback, direction, { movementX: movementX.value, movementY: movementY.value })
    }, { direction: pointPosition[direction][3] })
    return isPress
  }
  // create contour points - 创建轮廓点
  function createContourPoint (target, { direction }) {
    return pointElements[direction] || (pointElements[direction] = document.createElement('div'))
  }
  // initialize the contour point - 初始化轮廓点
  function initContourPoints (target, pointPosition, pointSize) {
    for (const direction in pointPosition) {
      const point = createContourPoint(target, { direction })
      initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize }, pointDefaultStyle)
      appendChild(target.parentNode, point)

      const isPress = addDragFunctionToPoint(target, { point, pointPosition, direction, pointSize })
      // update the width and height information when releasing the mouse
      // 当释放鼠标时更新宽度和高度信息
      watch(isPress, pointIsPressChangeCallback(target, { initialTarget, pointState }))
    }
  }
  // whether the resize function is required - 是否需要调整大小功能
  function whetherNeedResizeFunction (target, pointSize, resize) {
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

    limitTargetResize(target, { direction, movementX, movementY }, { initialTarget, containerInfo, minWidth, minHeight })

    updateTargetStyle(target, { direction, movementX, movementY }, { targetState, initialTarget })

    updatePointPosition(target, { direction, movementX, movementY }, { initialTarget, pointElements, pointSize, pointState })
  }



  /**
   * @description handles the drag and drop function of the target element - 处理目标元素的拖放函数
   * @param target
   */
  // a callback that is executed when isPress changes - isPress发生变化时执行的回调
  function isPressChangeCallback ({ downPointPosition, movementX, movementY }) {
    return (newV) => {
      targetState.isPress = newV
      if (newV) {
        // the coordinates of all contour points are recorded when the target element is pressed
        // 当按下目标元素时，记录所有轮廓点的坐标
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        // mouse up to update the coordinates of the target element
        // 鼠标抬起时更新目标元素的坐标
        updateInitialTarget(initialTarget, { top: initialTarget.top + movementY.value, left: initialTarget.left + movementX.value })
      }
    }
  }
  function whetherNeedDragFunction (target, downPointPosition) {
    processBlurOrFocus(target)
    if (!drag) return
    const { movementX, movementY, isPress } = useMovePoint(
      target,
      moveTargetCallback(dragCallback, {
        downPointPosition, pointElements, targetState, initialTarget, containerInfo
      }),
      { direction: limitDragDirection })
    watch(isPress, isPressChangeCallback({ downPointPosition, movementX, movementY }))
  }

  return {
    targetLeft: toRef(targetState, 'left'),
    targetTop: toRef(targetState, 'top'),
    targetWidth: toRef(targetState, 'width'),
    targetHeight: toRef(targetState, 'height'),
    targetIsPress: toRef(targetState, 'isPress'),
    pointLeft: toRef(pointState, 'left'),
    pointTop: toRef(pointState, 'top'),
    direction: toRef(pointState, 'direction'),
    pointIsPress: toRef(pointState, 'isPress'),
    pointMovementX: toRef(pointState, 'movementX'),
    pointMovementY: toRef(pointState, 'movementY')
  }
}
