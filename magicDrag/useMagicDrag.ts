import { toRef, nextTick } from 'vue'
import { getElement, mergeObject, removeElements, baseErrorTips, checkParameterType } from './utils/tools'
import { todoUnMount, blurOrFocus, updateInitialTarget, initTargetStyle, updateState, initTargetCoordinate } from './utils/magicDrag'
import { duplicateRemovalPlugin, executePluginInit, Plugin } from './plugins'
import { ElementParameter } from './functions/stateManager'
import { MAGIC_DRAG } from './style/className'
import Draggable from './functions/draggable'
import Resizeable from './functions/resizeable'
import { PluginManager } from './functions/pluginManager'
import { RefLine } from './plugins/refLine'
import Keymap from './plugins/keymap'
import {
  allElement,
  defaultOptions,
  defaultState,
  MagicDragOptions,
  MagicDragState,
  storingDataContainer
} from './common/magicDragAssist'
import StateManager from './functions/stateManager'

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
*  9.新增的图层级应该更高
*  10.设置初始尺寸
* MARK 公用的方法组合成一个类
* */

// default configuration
// 默认配置
const { allTarget, allContainer } = allElement()
let { $target, $container, initialTarget, pointElements, containerInfo, downPointPosition } = storingDataContainer()
// 目标元素的状态和轮廓点的状态
const { targetState, pointState } = defaultState()

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

const pluginManager = new PluginManager()
const stateManager = new StateManager()
const refLine = new RefLine({ gap: 10 })
const keymap = new Keymap()

pluginManager.registerPlugin(refLine.name, refLine)
pluginManager.registerPlugin(keymap.name, keymap)

function useMagicDragAPI (
  targetSelector: string | HTMLElement,
  options?: MagicDragOptions,
  plugins?: Plugin[],
  TEST = false
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
  const processBlurOrFocus = blurOrFocus(elementParameter.pointElements, stateParameter.targetState, stateManager)

	nextTick(() => {
    initContainer()

		initTarget()

    pluginManager.installPlugin(refLine.name)
    pluginManager.installPlugin(keymap.name)

    // 注册元素状态的同时将元素设置为选中元素（初始化Draggable和Resizeable时需要使用）
    stateManager.registerElementState($target.value, { elementParameter, stateParameter, globalDataParameter, optionParameter: options }, true)
    options.skill.drag && new Draggable(pluginManager, { elementParameter, stateParameter, globalDataParameter, optionParameter: options }, stateManager)
    options.skill.resize && new Resizeable(pluginManager, { elementParameter, stateParameter, globalDataParameter, optionParameter: options }, stateManager)
    executePluginInit(plugins, elementParameter, stateParameter, globalDataParameter, options)

    // 处理点击目标元素显示/隐藏轮廓点的逻辑
    processBlurOrFocus($target.value)
  })

  todoUnMount(() => {
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
    allTarget.push($target.value)

    baseErrorTips(!$target.value, 'targetSelector is an invalid selector or HTMLElement')

    initTargetStyle($target.value)

    initTargetCoordinate($target.value, globalDataParameter.initialTarget, TEST)

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

  checkParameterType(defaultOptions(), options)
  options = mergeObject(defaultOptions(), options)
  const { customPointClass } = options.customClass
  baseErrorTips(customPointClass.startsWith(MAGIC_DRAG), `custom class names cannot start with ${MAGIC_DRAG}, please change your class name`)

  plugins = duplicateRemovalPlugin(plugins)

  return useMagicDragAPI(
    targetSelector,
    options,
    plugins
  )
}

export function testMagicDrag (
  targetSelector: string | HTMLElement,
  options?: MagicDragOptions,
  plugins: Plugin[] = []
) {
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

  checkParameterType(defaultOptions(), options)
  options = mergeObject(defaultOptions(), options)
  const { customPointClass } = options.customClass
  baseErrorTips(customPointClass.startsWith(MAGIC_DRAG), `custom class names cannot start with ${MAGIC_DRAG}, please change your class name`)

  plugins = duplicateRemovalPlugin(plugins)

  return useMagicDragAPI(
    targetSelector,
    options,
    plugins,
    true
  )
}
