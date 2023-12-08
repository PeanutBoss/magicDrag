import { toRef, computed } from '@vue/reactivity'
import { nextTick } from './helper'
import { getElement, removeElements, baseErrorTips, setStyle } from './utils/tools'
import { pluginManager, setInitialState, stateManager } from './manager'
import { ElementParameter, GlobalDataParameter, State, StateParameter, Draggable, Resizeable } from './functions'
import { addGlobalUnmountCb, MagicDragOptions, MagicDragState, unMountGlobalCb } from './common/globalData'
import { fixContourExceed } from './common/magicDrag'
import {
  blurOrFocus, updateInitialTarget, initTargetStyle,
  updateState, saveInitialData, getPointValue
} from './common/magicDrag'
import BuildState from './common/buildState'

// @ts-ignore
window.stateManager = stateManager

/*
* TODO
*  * 通过globalData为一个目标元素创建一个状态对象
*  * 初始化目标元素、容器元素的操作用一个类来做
*  15.使用 key 的映射表来保存坐标、尺寸等信息
*  18.目标元素的 left、top 应该是相对容器计算
*  23.等比缩放
*  24.将用户传入的不支持使用的值修改为默认值并警告
*  26.通过调用API的方式来处理配置信息
*  27.style类控制样式
*  28.包裹、容器元素位置信息兼容
* */

// default configuration
// 默认配置
let {
  allTarget, allContainer,
  publicTarget, publicContainer, pointElements, containerInfo, downPointPosition,
  targetState, pointState,
  // left, top, width, height, id, coordinate // 坐标信息必须是独立的
} = new BuildState().publicState

let initialTarget
function initGlobalData () {
  publicTarget.value = null
  publicContainer.value = null
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
): MagicDragState {
  const { containerSelector } = options

  const privateState = new BuildState().privateState

  // 初始化全局数据
  initGlobalData()
  initGlobalStyle()
  const stateParameter: StateParameter = { pointState, targetState }
  const globalDataParameter: GlobalDataParameter = { initialTarget, containerInfo, downPointPosition }
  const elementParameter: ElementParameter = {
    pointElements, allTarget, allContainer,
    target: publicTarget,
    container: publicContainer,
    privateTarget: null as HTMLElement,
    privateContainer: null as HTMLElement
  }

  // 显示或隐藏轮廓点的方法
  const processBlurOrFocus = blurOrFocus(pointElements, targetState, stateManager)
  // 每次都是获取到一个新闭包，需要单独保存
  addGlobalUnmountCb(processBlurOrFocus.bind(null, publicTarget.value, false))

	nextTick(readyMagicDrag)

  function readyMagicDrag() {
    initContainer()
    initTarget()
    // 注册元素状态的同时将元素设置为选中元素（初始化Draggable和Resizeable时需要使用）
    setInitialState(publicTarget.value, initialState(), true)
    enableDragFunc()
    enableResizeFunc()
    // 处理点击目标元素显示/隐藏轮廓点的逻辑
    processBlurOrFocus(publicTarget.value)
  }

  // initializes the container element - 初始化容器元素
  function initContainer () {
    saveContainerEl()
    enableContainerGrid()
    guaranteeOpenPosition()
    saveContainerSizeAndOffset(contentAreaSize(), contentAreaOffset())
    function saveContainerEl() {
      elementParameter.privateContainer = publicContainer.value = getElement(containerSelector)
      allContainer.push(publicContainer.value)
    }
    // 容器尺寸信息
    function contentAreaSize() {
      const {
        paddingLeft, paddingRight, paddingTop, paddingBottom, width, height, boxSizing,
        borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth
      } = getComputedStyle(publicContainer.value)

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
    // 容器相对body内容左上角的偏移量（如果容器元素的父级不是body可能出现问题）
    function contentAreaOffset() {
      const { paddingLeft = '0', paddingTop = '0' } = getComputedStyle(publicContainer.value)

      // 如果开启定位，返回偏移量
      return {
        offsetLeft: parseInt(paddingLeft),
        offsetTop: parseInt(paddingTop)
      }
    }
    function saveContainerSizeAndOffset({ containerWidth, containerHeight }, { offsetLeft, offsetTop }) {
      globalDataParameter.containerInfo.width = containerWidth
      globalDataParameter.containerInfo.height = containerHeight
      globalDataParameter.containerInfo.offsetLeft = offsetLeft
      globalDataParameter.containerInfo.offsetTop = offsetTop
      containerInfo.width = containerWidth
      containerInfo.height = containerHeight
      containerInfo.offsetLeft = offsetLeft
      containerInfo.offsetTop = offsetTop
    }
    // 如果容器元素未开启定位，给它开启相对定位
    function guaranteeOpenPosition() {
      const { position } = getComputedStyle(publicContainer.value)
      if (['relative', 'absolute', 'fixed'].includes(position)) publicContainer.value.style.position = 'relative'
    }
  }

  // initializes the target element - 初始化目标元素
  function initTarget () {
    // 保存目标元素的引用
    saveTargetEl()
    baseErrorTips(!publicTarget.value, 'targetSelector is an invalid selector or HTMLElement')
    // 保存目标元素的信息和绑定事件
    saveAndBindTargetData()
    // 初始化目标元素样式信息
    initTargetStyle(publicTarget.value, posRelativeToContainer().size, posRelativeToContainer().position)
    // 初始化
    saveInitialData(publicTarget.value, globalDataParameter.initialTarget)
    saveInitialData(publicTarget.value, privateState.coordinate)
    // 初始化结束后更新状态
    updateState(targetState, globalDataParameter.initialTarget)
    // 计算相对容器的尺寸信息
    function posRelativeToContainer() {
      const left = options.initialInfo.left + containerInfo.offsetLeft
      const top = options.initialInfo.top + containerInfo.offsetTop
      return { position: { left, top }, size: { width: options.initialInfo.width, height: options.initialInfo.height } }
    }
    function saveTargetEl() {
      privateState.privateTarget = publicTarget.value = getElement(targetSelector)
      allTarget.push(publicTarget.value)
    }
    function saveAndBindTargetData() {
      publicTarget.value.addEventListener('mousedown', updateTargetPointTo)
      publicTarget.value.dataset.index = String(allTarget.length)
    }
  }

  return {
    targetLeft: computed(() => targetState.left - stateManager.containerLeft),
    targetTop: computed(() => targetState.top - stateManager.containerTop),
    targetWidth: toRef(targetState, 'width'),
    targetHeight: toRef(targetState, 'height'),
    targetIsPress: toRef(targetState, 'isPress'),
    targetIsLock: toRef(targetState, 'isLock'),
    pointLeft: computed(() => getPointValue(pointState, 'left')),
    pointTop: computed(() => getPointValue(pointState, 'top')),
    direction: toRef(pointState, 'direction'),
    pointIsPress: toRef(pointState, 'isPress'),
    pointMovementX: toRef(pointState, 'movementX'),
    pointMovementY: toRef(pointState, 'movementY'),
    getStateList() {
      return stateManager.elementStates.map(m => m.state)
    },
    getTargetState() {
      return stateManager.currentState
    },
    unMount
  }

  function unMount() {
    // 卸载全局监听等
    unMountGlobalCb()
    // 解绑所有插件
    pluginManager.uninstallPlugin()
    // 页面卸载时销毁 dom 元素
    removeElements(pointElements)
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
    publicTarget.value = event.target
  }
  function initialState(): any {
    return {
      allTarget, allContainer,
      publicTarget, publicContainer, pointElements, containerInfo, downPointPosition,
      targetState, pointState,
      ...privateState, options
    }
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
  function enableContainerGrid() {
    options.grid && setContainerGrid()
    function setContainerGrid() {
      setStyle(publicContainer.value, {
        background: 'white',
        backgroundImage:`linear-gradient(90deg,rgba(241,243,244,1) 10%,transparent 0),
        linear-gradient(rgba(241,243,244,1) 10%,transparent 0)`,
        backgroundSize: '10px 10px'
      })
    }
  }
}
