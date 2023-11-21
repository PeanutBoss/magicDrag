import { toRef, computed } from '@vue/reactivity'
import { nextTick } from './helper'
import { getElement, removeElements, baseErrorTips, setStyle, numberToStringSize } from './utils/tools'
import { setInitialState, pluginManager, stateManager } from './manager'
import {ElementParameter, GlobalDataParameter, State, StateParameter, Draggable, Resizeable} from './functions'
import globalData, {
  addGlobalUnmountCb,
  MagicDragOptions,
  MagicDragState,
  unMountGlobalCb
} from './common/globalData'
import { fixContourExceed } from './common/magicDrag'
import {
  blurOrFocus, updateInitialTarget, initTargetStyle,
  updateState, saveInitialData, showOrHideContourPoint, getPointValue
} from './common/magicDrag'

// @ts-ignore
window.stateManager = stateManager

/*
* TODO
*  * 通过globalData为一个目标元素创建一个状态对象
*  15.使用 key 的映射表来保存坐标、尺寸等信息
*  18.目标元素的 left、top 应该是相对容器计算
*  23.等比缩放
*  24.将用户传入的不支持使用的值修改为默认值并警告
*  26.通过调用API的方式来处理配置信息
*  27.style类控制样式
* */

// default configuration
// 默认配置
const { allTarget, allContainer } = globalData.allElement()
let { $target, $container, initialTarget, pointElements, containerInfo, downPointPosition } = globalData.storingDataContainer()
// 目标元素的状态和轮廓点的状态
const { targetState, pointState } = globalData.defaultState
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

export function useMagicDragAPI (
  targetSelector: string | HTMLElement,
  options?: MagicDragOptions,
  TEST = false
): MagicDragState {
  const { containerSelector } = options

  // 初始化全局数据
  initGlobalData()
  initGlobalStyle()
  const stateParameter: StateParameter = { pointState, targetState }
  const globalDataParameter: GlobalDataParameter = { initialTarget, containerInfo, downPointPosition }
  const elementParameter: ElementParameter = {
    pointElements, allTarget, allContainer,
    target: $target,
    container: $container,
    privateTarget: null as HTMLElement,
    privateContainer: null as HTMLElement
  }

  // 显示或隐藏轮廓点的方法
  const processBlurOrFocus = blurOrFocus(elementParameter.pointElements, stateParameter.targetState, stateManager)
  // 每次都是获取到一个新闭包，需要单独保存
  addGlobalUnmountCb(processBlurOrFocus.bind(null, $target.value, false))

	nextTick(readyMagicDrag)

  function readyMagicDrag() {
    initContainer()
    initTarget()
    // 注册元素状态的同时将元素设置为选中元素（初始化Draggable和Resizeable时需要使用）
    setInitialState($target.value, initialState(), true)
    enableDragFunc()
    enableResizeFunc()
    // 处理点击目标元素显示/隐藏轮廓点的逻辑
    processBlurOrFocus($target.value)
  }

  // initializes the container element - 初始化容器元素
  function initContainer () {
    saveContainerEl()
    setContainerGrid()
    saveContainerSizeAndOffset(contentAreaSize(), contentAreaOffset())
    function saveContainerEl() {
      elementParameter.privateContainer = $container.value = getElement(containerSelector)
      allContainer.push(elementParameter.privateContainer)
    }
    function contentAreaSize() {
      const {
        paddingLeft, paddingRight, paddingTop, paddingBottom, width, height, boxSizing,
        borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth
      } = getComputedStyle(elementParameter.container.value)
      return { containerWidth: containerWidth(), containerHeight: containerHeight() }
      function isBorderBox() {
        return boxSizing === 'border-box'
      }
      function containerHeight() {
        return isBorderBox()
          ? parseInt(height) - parseInt(paddingTop) - parseInt(paddingBottom) - parseInt(borderBottomWidth) - parseInt(borderTopWidth)
          : parseInt(height)
      }
      function containerWidth() {
        return isBorderBox()
          ? parseInt(width) - parseInt(paddingLeft) - parseInt(paddingRight) - parseInt(borderLeftWidth) - parseInt(borderRightWidth)
          : parseInt(width)
      }
    }
    function contentAreaOffset() {
      const containerRect = elementParameter.container.value.getBoundingClientRect()
      return { offsetLeft: containerRect.left, offsetTop: containerRect.top }
    }
    function saveContainerSizeAndOffset({ containerWidth, containerHeight }, { offsetLeft, offsetTop }) {
      globalDataParameter.containerInfo.width = containerWidth
      globalDataParameter.containerInfo.height = containerHeight
      globalDataParameter.containerInfo.offsetLeft = offsetLeft
      globalDataParameter.containerInfo.offsetTop = offsetTop
    }
    function setContainerGrid() {
      const gridStyleData = {
        background: 'white',
        backgroundImage:`linear-gradient(90deg,rgba(241,243,244,1) 10%,transparent 0),
        linear-gradient(rgba(241,243,244,1) 10%,transparent 0)`,
        backgroundSize: '10px 10px'
      }
      setStyle($container.value, gridStyleData)
    }
  }

  // initializes the target element - 初始化目标元素
  function initTarget () {
    // 保存目标元素的引用
    saveTargetEl()
    baseErrorTips(!$target.value, 'targetSelector is an invalid selector or HTMLElement')
    // 保存目标元素的信息和绑定事件
    saveAndBindTargetData()
    // 初始化目标元素样式信息
    initTargetStyle($target.value, posRelativeToContainer().size, posRelativeToContainer().position)
    // 初始化
    saveInitialData($target.value, globalDataParameter.initialTarget)
    // 初始化结束后更新状态
    updateState(stateParameter.targetState, globalDataParameter.initialTarget)
    // 计算相对容器的尺寸信息
    function posRelativeToContainer() {
      const left = globalDataParameter.containerInfo.offsetLeft + options.initialInfo.left
      const top = globalDataParameter.containerInfo.offsetTop + options.initialInfo.top
      return { position: { left, top }, size: { width: options.initialInfo.width, height: options.initialInfo.height } }
    }
    function saveTargetEl() {
      elementParameter.privateTarget = $target.value = getElement(targetSelector)
      allTarget.push($target.value)
    }
    function saveAndBindTargetData() {
      $target.value.addEventListener('mousedown', updateTargetPointTo)
      $target.value.dataset.index = allTarget.length
    }
  }

  return {
    targetLeft: computed(() => stateParameter.targetState.left - stateManager.containerLeft),
    targetTop: computed(() => stateParameter.targetState.top - stateManager.containerTop),
    targetWidth: toRef(stateParameter.targetState, 'width'),
    targetHeight: toRef(stateParameter.targetState, 'height'),
    targetIsPress: toRef(stateParameter.targetState, 'isPress'),
    targetIsLock: toRef(stateParameter.targetState, 'isLock'),
    pointLeft: computed(() => getPointValue(stateParameter.pointState, 'left')),
    pointTop: computed(() => getPointValue(stateParameter.pointState, 'top')),
    direction: toRef(stateParameter.pointState, 'direction'),
    pointIsPress: toRef(stateParameter.pointState, 'isPress'),
    pointMovementX: toRef(stateParameter.pointState, 'movementX'),
    pointMovementY: toRef(stateParameter.pointState, 'movementY'),
    getStateList() {
      return stateManager.elementStates.map(m => m.state.globalDataParameter.initialTarget)
    },
    getTargetState() {
      return stateManager.currentState.globalDataParameter.initialTarget
    },
    unMount
  }

  function unMount() {
    // 卸载全局监听等
    unMountGlobalCb()
    // 解绑所有插件
    pluginManager.uninstallPlugin()
    // 页面卸载时销毁 dom 元素
    removeElements(elementParameter.pointElements)
    // 移除所有目标元素的监听事件
    removeListener()
    // 清除状态信息
    stateManager.clear()
    function removeListener() {
      stateManager.elementStates
        .map(m => m.element)
        .forEach(el => el.removeEventListener('mousedown', updateTargetPointTo))
    }
  }
  function updateTargetPointTo(event) {
    $target.value = event.target
  }
  function initialState(): State {
    return { elementParameter, stateParameter, globalDataParameter, optionParameter: options }
  }
  function enableDragFunc() {
    options.skill.drag && new Draggable(pluginManager, initialState(), stateManager)
  }
  function enableResizeFunc() {
    options.skill.resize && new Resizeable(pluginManager, initialState(), stateManager)
  }
  function initGlobalStyle() {
    options.containerSelector === 'body' && fixContourExceed()
  }
}
