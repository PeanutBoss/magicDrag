import { onBeforeUnmount, Ref, reactive, toRef, nextTick, ref } from 'vue'
import { getElement, mergeObject, removeElements, baseErrorTips, checkParameterType, baseWarnTips } from './utils/tools.ts'
import { blurOrFocus, updateInitialTarget, initTargetStyle, updateState, initTargetCoordinate } from './utils/magicDrag.ts'
import { duplicateRemovalPlugin, executePluginInit, Plugin } from './plugins/index.ts'
import { ElementParameter, setParameter } from './utils/parameter.ts'
import { ClassName, MAGIC_DRAG } from './style/className.ts'
import type { Direction } from './utils/magicDrag.ts'
import Drag from './plugins/drag.ts'
import Resize from './plugins/resize.ts'
import ContextMenu, { DefaultContextMenuOptions, ActionKey } from './plugins/contextMenu/index.ts'
import { actionMap } from './plugins/contextMenu/actionMap.ts'

/*
* TODO
*  1.window触发resize的时候需要更新containerInfo
*  2.useMagicDrag使用时需要创建，否则会有参数冲突问题
*  3.拖拽元素达到边界且边界有达到吸附条件的元素时会跳动
*  4.可以根据轮廓点的类名获取它的尺寸
*  5.参考线样式
*  6.根据层级顺序获取元素列表
*  7.优化插件机制
*  8.重构
* */

export interface MagicDragOptions {
  containerSelector: string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  pointSize?: number
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
    contextMenu?: boolean
    limitRatio?: [number, number]
    limitDragDirection?: 'X' | 'Y' | null
  }
  callbacks?: {
    dragCallback?: (moveTargetAction: (moveAction) => void, movement: { movementX: number, movementY: number }) => void
    resizeCallback?: (moveResizeAction: (moveAction) => void, direction: Direction, movement: { movementX: number, movementY: number } ) => void
  }
  customClass?: {
    customPointClass?: string
  }
  contextMenuOption?: DefaultContextMenuOptions
  actionList?: ActionKey[]
  plugins?: Plugin[]
}
// default configuration
// 默认配置
const defaultOptions: MagicDragOptions = {
  containerSelector: 'body',
  minWidth: 100, // minimum width - 最小宽度
  minHeight: 100, // minimum height - 最小高度
  maxWidth: 100000, // 最大宽度
  maxHeight: 100000, // 最大高度
  pointSize: 10, // the size of the contour point - 轮廓点的大小
  // pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
  skill: {
    resize: true, // whether the size adjustment is supported - 是否支持大小调整
    drag: true, // whether to support dragging - 是否支持拖动
    contextMenu: true,
    limitDragDirection: null // restricted direction of movement - 限制移动方向
  },
  contextMenuOption: {
    offsetX: 20, // 复制的新元素的X轴偏移量
    offsetY: 20, // 复制的新元素的Y轴偏移量
    lockTargetClassName: ClassName.LockTargetClassName, // 目标元素锁定的类名
    containerClassName: ClassName.ContainerClassName, // menuContext容器的类名
    itemClassName: ClassName.ItemClassName, // menuContext选项的类名
    lockItemClassName: ClassName.LockItemClassName // 锁定目标元素后menuContext选项的类名
  },
  actionList: Object.keys(actionMap) as ActionKey[],
  customClass: {
    customPointClass: ClassName.OutlinePoint, // 自定义轮廓点的类名
  },
  callbacks: {}
}

const allTarget: HTMLElement[] = []
const allContainer: HTMLElement[] = []

interface MagicDragState {
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

function useMagicDragAPI (
  targetSelector: string | HTMLElement,
  options?: MagicDragOptions,
  plugins?: Plugin[]
): MagicDragState {
  const { containerSelector } = options

  initGlobalData()
  let stateParameter = {
    pointState,
    targetState
  }
  let elementParameter: ElementParameter = {
    target: $target,
    container: $container,
    pointElements,
    allTarget,
    allContainer,
    privateContainer: null,
    privateTarget: null
  }
  let globalDataParameter = {
    initialTarget: { ...initialTarget },
    containerInfo:{ ...containerInfo },
    downPointPosition: { ...downPointPosition },
    plugins
  }

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
    elementParameter.privateContainer = $container.value = getElement(containerSelector)
    allContainer.push(elementParameter.privateContainer)
    const { paddingLeft, paddingRight, paddingTop, paddingBottom, width, height, boxSizing } = getComputedStyle(elementParameter.container.value)
    const isBorderBox = boxSizing === 'border-box'
    const containerWidth = isBorderBox ? parseInt(width) - parseInt(paddingLeft) - parseInt(paddingRight) : parseInt(width)
    const containerHeight = isBorderBox ? parseInt(height) - parseInt(paddingTop) - parseInt(paddingBottom) : parseInt(height)
    globalDataParameter.containerInfo.width = containerWidth
    globalDataParameter.containerInfo.height = containerHeight
  }

  function updateTargetValue (event) {
    $target.value = event.target
  }
  // initializes the target element - 初始化目标元素
  function initTarget () {
    elementParameter.privateTarget = $target.value = getElement(targetSelector)

    $target.value.addEventListener('click', updateTargetValue)

    $target.value.dataset.index = allTarget.length
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

export default function useMagicDrag (
  targetSelector: string | HTMLElement,
  options?: MagicDragOptions,
  plugins: Plugin[] = []
) {
  // check whether targetSelector is a selector or an HTMLElement
  // 检查 targetSelector 是否为选择器或 HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions, options)
  options = mergeObject(defaultOptions, options)
  const { contextMenuOption, actionList } = options
  const { drag, resize, contextMenu } = options.skill
  const { customPointClass } = options.customClass
  baseErrorTips(customPointClass.startsWith(MAGIC_DRAG), `custom class names cannot start with ${MAGIC_DRAG}, please change your class name`)

  drag && plugins.push(Drag)
  resize && plugins.push(Resize)
  baseWarnTips(actionList.length === 0, 'check that the actionList is empty and the use of ContextMenu is cancelled')
  actionList.length && contextMenu && plugins.push(new ContextMenu(actionList, contextMenuOption))

  plugins = duplicateRemovalPlugin(plugins)

  return useMagicDragAPI(
    targetSelector,
    options,
    plugins
  )
}

export function getUseMagicDrag (options: MagicDragOptions, plugins: Plugin[] = []) {
  /*
    targetSelector: string | HTMLElement,
    options?: MagicDragOptions,
    plugins?: Plugin[]
  */
  return (targetSelector) => {
    return useMagicDrag(targetSelector, options, plugins)
  }
}
