import { onBeforeUnmount, Ref, reactive, toRef, nextTick, ref, watch } from 'vue'
import { getElement, mergeObject, removeElements, baseErrorTips, checkParameterType } from './utils/tools.ts'
import {
  blurOrFocus, updateInitialTarget, initTargetStyle, updateState, initTargetCoordinate
} from './utils/dragResize.ts'
import { executePluginInit, Plugin } from './plugins/index.ts'
import type { Direction } from './utils/dragResize.ts'
import Drag from './plugins/drag.ts'
import Resize from './plugins/resize.ts'
import { getParameter, setParameter } from './utils/parameter.ts'

interface DragResizeOptions {
  containerSelector: string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
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
    dragCallback?: (moveTargetAction: (moveAction) => void, movement: { movementX: number, movementY: number }) => void
    resizeCallback?: (moveResizeAction: (moveAction) => void, direction: Direction, movement: { movementX: number, movementY: number } ) => void
  },
  plugins?: Plugin[]
}
// default configuration
// 默认配置
const defaultOptions: DragResizeOptions = {
  containerSelector: 'body',
  minWidth: 100, // minimum width - 最小宽度
  minHeight: 100, // minimum height - 最小高度
  maxWidth: 100000, // 最大宽度
  maxHeight: 100000, // 最大高度
  pointSize: 10, // the size of the contour point - 轮廓点的大小
  pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
  skill: {
    resize: true, // whether the size adjustment is supported - 是否支持大小调整
    drag: true, // whether to support dragging - 是否支持拖动
    limitDragDirection: null // restricted direction of movement - 限制移动方向
  },
  callbacks: {}
}

const allTarget: HTMLElement[] = []

interface DragResizeState {
  targetLeft: Ref<number>
  targetTop: Ref<number>
  targetWidth: Ref<number>
  targetHeight: Ref<number>
  targetIsLock: Ref<boolean>
  pointLeft: Ref<number>
  pointTop: Ref<number>
  pointMovementX: Ref<number>
  pointMovementY: Ref<number>
  targetIsPress: Ref<boolean>
  pointIsPress: Ref<boolean>
  direction: Ref<string | null>
}

// the target element being manipulated
// 操作的目标元素和容器元素
let $target = ref(null), $container = ref(null)
// coordinates and dimensions of the target element - 目标元素的坐标和尺寸
let initialTarget
// save contour point - 保存轮廓点
let pointElements
// 容器元素的坐标信息
let containerInfo
// It is used to record the position information of each contour point when the target element is pressed
// 用于记录目标元素被按下时各个轮廓点的位置信息
let downPointPosition
// 目标元素的状态
const targetState = reactive({
  left: 0,
  top: 0,
  height: 0,
  width: 0,
  isPress: false,
  isLock: false
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

function initGlobalData () {
  $target.value = null
  $container.value = null
  initialTarget = updateInitialTarget()
  pointElements = pointElements || {}
  containerInfo = {}
  downPointPosition = {}
  Object.assign(targetState, { left: 0, top: 0, height: 0, width: 0, isPress: false, isLock: false })
  Object.assign(pointState, { left: 0, top: 0, direction: null, isPress: false, movementX: 0, movementY: 0 })
}
function updateGlobalData (target) {
  console.log(getParameter(target.dataIndex))
}

watch($target, (newV) => {
  if (!newV) return
  console.log('更新该目标元素对应的所有状态信息', newV)
  updateGlobalData(newV)
})

function useDragResizeAPI (
  targetSelector: string | HTMLElement,
  options?: DragResizeOptions,
  plugins?: Plugin[]
): DragResizeState {
  const { containerSelector } = options

  initGlobalData()
  let stateParameter = { pointState, targetState }
  let elementParameter = { target: $target, container: $container, pointElements, allTarget }
  let globalDataParameter = { initialTarget, containerInfo, downPointPosition }

  // 显示或隐藏轮廓点的方法
  const processBlurOrFocus = blurOrFocus(elementParameter.pointElements, stateParameter.targetState)

	nextTick(() => {
    initContainer()

		initTarget()

    executePluginInit(plugins, elementParameter, stateParameter, globalDataParameter, options)

    // 处理点击目标元素显示/隐藏轮廓点的逻辑
    processBlurOrFocus($target.value)
  })
  onBeforeUnmount(() => {
    // unbind the mousedown event added for window to handle the target element
    //  解绑为 window 添加的 mousedown 事件以处理目标元素
    processBlurOrFocus($target.value, false)
    // the dom element is destroyed when the page is uninstalled
    // 页面卸载时销毁 dom 元素
    removeElements(Object.values(elementParameter.pointElements))
    $target.value.removeEventListener('click', updateTargetValue)
  })

  // initializes the container element - 初始化容器元素
  function initContainer () {
    $container.value = getElement(containerSelector)
    const { paddingLeft, paddingRight, paddingTop, paddingBottom, width, height } = getComputedStyle(elementParameter.container.value)
    const containerWidth = parseInt(width) - parseInt(paddingLeft) - parseInt(paddingRight)
    const containerHeight = parseInt(height) - parseInt(paddingTop) - parseInt(paddingBottom)
    globalDataParameter.containerInfo.width = containerWidth
    globalDataParameter.containerInfo.height = containerHeight
  }

  function updateTargetValue (event) {
    $target.value = event.target
  }
  // initializes the target element - 初始化目标元素
  function initTarget () {
    $target.value = getElement(targetSelector)

    $target.value.addEventListener('click', updateTargetValue)

    $target.value.dataIndex = allTarget.length
    setParameter(allTarget.length, { elementParameter, stateParameter, globalDataParameter, optionParameter: options })
    allTarget.push($target.value)

    baseErrorTips(!$target.value, 'targetSelector is an invalid selector or HTMLElement')

    initTargetStyle($target.value)

    initTargetCoordinate($target.value, globalDataParameter.initialTarget)

    // 初始化结束后更新状态
    updateState(stateParameter.targetState, globalDataParameter.initialTarget)
  }


  return {
    targetLeft: toRef(stateParameter.targetState, 'left'),
    targetTop: toRef(stateParameter.targetState, 'top'),
    targetWidth: toRef(stateParameter.targetState, 'width'),
    targetHeight: toRef(stateParameter.targetState, 'height'),
    targetIsPress: toRef(stateParameter.targetState, 'isPress'),
    targetIsLock: toRef(stateParameter.targetState, 'isLock'),
    pointLeft: toRef(stateParameter.pointState, 'left'),
    pointTop: toRef(stateParameter.pointState, 'top'),
    direction: toRef(stateParameter.pointState, 'direction'),
    pointIsPress: toRef(stateParameter.pointState, 'isPress'),
    pointMovementX: toRef(stateParameter.pointState, 'movementX'),
    pointMovementY: toRef(stateParameter.pointState, 'movementY')
  }
}

export default function useDragResize (
  targetSelector: string | HTMLElement,
  options?: DragResizeOptions,
  plugins?: Plugin[]
) {
  // check whether targetSelector is a selector or an HTMLElement
  // 检查 targetSelector 是否为选择器或 HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions, options)

  options = mergeObject(defaultOptions, options)
  const { drag, resize } = options.skill

  drag && plugins.push(Drag)
  resize && plugins.push(Resize)

  // MARK 把Parameter作为useDragResizeAPI的参数
  return useDragResizeAPI(
    targetSelector,
    options,
    plugins
  )
}
