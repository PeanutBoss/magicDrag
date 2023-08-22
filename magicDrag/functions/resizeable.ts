import {watch} from 'vue'
import { PluginBlueprint } from '../../pluginBlueprint/pluginManager.ts'
import {getCurrentTarget, getParameter, Parameter} from '../utils/parameter.ts'
import {
  Direction, InitPointOption, PointPosition,
  limitTargetResize, setPosition, updateInitialTarget, updatePointPosition, updateTargetStyle, getCoordinateByElement
} from '../utils/magicDrag.ts'
import {addClassName, appendChild, setStyle, transferControl} from '../utils/tools.ts'
import useMoveElement from '../useMoveElement.ts'
import {executeActionCallbacks, getActionCallbacks} from '../plugins/contextMenu/actionMap.ts'

const resizeActions = getActionCallbacks('resizeCallbacks')

export default class Resizeable {
  constructor(private plugins: PluginBlueprint.PluginManager = new PluginBlueprint.PluginManager(), parameter: Parameter) {
    this.init(parameter)
  }

  init({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
    const pointPosition = this.createParentPosition(globalDataParameter.initialTarget, optionParameter.pointSize)
    this.initContourPoints(elementParameter, stateParameter, globalDataParameter, optionParameter, { pointPosition })
  }

  createParentPosition ({ left, top, width, height }, pointSize: number): PointPosition {
    const halfPointSize = pointSize / 2
    return {
      lt: [left - halfPointSize, top - halfPointSize, 'nw-resize'],
      lb: [left - halfPointSize, top + height - halfPointSize, 'ne-resize'],
      rt: [left + width - halfPointSize, top - halfPointSize, 'ne-resize'],
      rb: [left + width - halfPointSize, top + height - halfPointSize, 'nw-resize'],
      t: [left + width / 2 - halfPointSize, top - halfPointSize, 'n-resize', 'X'],
      b: [left + width / 2 - halfPointSize, top + height - halfPointSize, 'n-resize', 'X'],
      l: [left - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y'],
      r: [left + width - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y']
    }
  }

  // 初始化轮廓点
  initContourPoints (elementParameter, stateParameter, globalDataParameter, options, runtimeParameter) {
    const { target, pointElements } = elementParameter
    const { pointState } = stateParameter
    const { pointPosition } = runtimeParameter
    const { pointSize, customClass: { customPointClass } } = options
    const { initialTarget } = globalDataParameter

    for (const direction in pointPosition) {
      const point = this.createContourPoint(pointElements, { direction })
      this.initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize })
      // addClassName(point, ClassName.OutlinePoint)
      addClassName(point, customPointClass)
      appendChild(target.value.parentNode, point)

      const isPress = this.addDragFunctionToPoint(elementParameter, stateParameter, globalDataParameter, options, { point, pointPosition, direction })
      // update the width and height information when releasing the mouse - 当释放鼠标时更新宽度和高度信息
      watch(isPress, this.pointIsPressChangeCallback(target.value, { initialTarget, pointState, direction }, elementParameter))
    }
  }

  pointIsPressChangeCallback (target, { initialTarget, pointState, direction }, elementParameter) {
    return newV => {
      // 与window绑定mousedown同理，取消无用更新
      const currentTarget = getCurrentTarget()
      if (target !== currentTarget) return
      pointState.isPress = newV
      pointState.direction = direction
      if (!newV) {
        pointState.direction = null
        updateInitialTarget(initialTarget, getCoordinateByElement(target))
      }
      // MARK 通知插件鼠标状态更新
      this.plugins.callExtensionPoint('pointPressChange', newV, elementParameter)
    }
  }

  // initializes the style of the contour points
  // 初始化轮廓点的样式
  initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption, pointDefaultStyle?) {
    pointDefaultStyle && setStyle(point, pointDefaultStyle)
    setStyle(point, 'width', pointSize + 'px')
    setStyle(point, 'height', pointSize + 'px')
    setStyle(point, 'cursor', pointPosition[direction][2])
    setPosition(point, pointPosition, direction)
  }

  // 为轮廓点添加拖拽功能
  addDragFunctionToPoint (elementParameter, stateParameter, globalDataParameter, options, runTimeParameter) {
    const { target } = elementParameter
    const { point, pointPosition, direction } = runTimeParameter
    const { resizeCallback } = options.callbacks || {}
    const { isPress, movementX, movementY } = useMoveElement(point, (moveAction) => {
      const moveResizeAction = () => {
        this.movePointCallback(
          stateParameter,
          elementParameter,
          globalDataParameter,
          options,
          { direction, movementX, movementY, moveAction, target: target.value }
        )
      }
      // Hand over control (moveResizeAction) - 将控制权（moveResizeAction）交出
      transferControl(moveResizeAction, resizeCallback, direction, { movementX: movementX.value, movementY: movementY.value })
    }, { direction: pointPosition[direction][3] })
    return isPress
  }

  movePointCallback (stateParameter, elementParameter, globalParameter, options, runTimeParameter) {
    const { moveAction, target, direction, movementX, movementY } = runTimeParameter

    const {
      globalDataParameter: { initialTarget, containerInfo },
      stateParameter: { targetState, pointState },
      optionParameter: { minWidth, minHeight, maxWidth, maxHeight, pointSize },
      elementParameter: { pointElements }
    } = getParameter(target.dataset.index)
    const parameter = getParameter(target.dataset.index)

    const isContinue = executeActionCallbacks(resizeActions, initialTarget, 'beforeCallback')
    if (isContinue === false) return

    moveAction()

    const _updateTargetStyle = ({ movementX, movementY }) => {
      updateTargetStyle(target, { direction, movementX, movementY }, { targetState, initialTarget })
    }
    const _updatePointPosition = ({ movementX, movementY }) => {
      updatePointPosition(target, { direction, movementX, movementY }, { initialTarget, pointElements, pointSize, pointState })
    }

    limitTargetResize(target, { direction, movementX, movementY }, { initialTarget, containerInfo, minWidth, minHeight, maxWidth, maxHeight })

    _updateTargetStyle({ movementX, movementY })

    _updatePointPosition({ movementX, movementY })

    this.plugins.callExtensionPoint('resize', parameter, { movementX, movementY, _updateTargetStyle, _updatePointPosition })
  }

  createContourPoint (pointElements, { direction }) {
    return pointElements[direction] || (pointElements[direction] = document.createElement('div'))
  }
}
