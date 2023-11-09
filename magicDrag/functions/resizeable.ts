import { watch } from '@vue/runtime-core'
import { State, PluginManager } from './index'
import {
  Direction, InitPointOption, PointPosition,
  limitTargetResize, setPosition, updateInitialTarget, updatePointPosition, updateTargetStyle, getCoordinateByElement
} from '../common/magicDrag'
import { addClassName, appendChild, conditionExecute, setStyle, transferControl } from '../utils/tools'
import { useMoveElement } from '../useMoveElement'
import { executeActionCallbacks, getActionCallbacks } from '../plugins/contextMenu/actionMap'

const resizeActions = getActionCallbacks('resizeCallbacks')

export default class Resizeable {
  constructor(private plugins: PluginManager = new PluginManager(), parameter: State, private stateManager) {
    this.init(stateManager.currentState)
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
    const { pointSize, customClass: { customPointClass }, customStyle: { pointStyle } } = options
    const { initialTarget } = globalDataParameter
    for (const direction in pointPosition) {
      const point = this.createContourPoint(pointElements, direction)
      this.initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize }, pointStyle)
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
      const currentTarget = this.stateManager.currentElement
      // 与window绑定mousedown同理，取消无用更新
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
    }, { limitDirection: pointPosition[direction][3] })
    return isPress
  }

  movePointCallback(stateParameter, elementParameter, globalParameter, options, runTimeParameter) {
    const { moveAction, target, direction, movementX, movementY } = runTimeParameter

    const parameter = this.stateManager.getElementState(target)
    const {
      globalDataParameter: { initialTarget, containerInfo },
      stateParameter: { targetState, pointState },
      optionParameter: { minWidth, minHeight, maxWidth, maxHeight, pointSize, ratio },
      elementParameter: { pointElements }
    } = parameter

    const isContinue = executeActionCallbacks(resizeActions, this.stateManager, 'beforeCallback')
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

  standardStrategies = {
    max(...rest) { return Math.max(...rest) },
    min(...rest) { return Math.min(...rest) }
  }

  /**
   * 等比缩放
   * @param movementX x轴移动的距离
   * @param movementY y轴移动的距离
   * @param width resize开始前的宽度
   * @param height resize开始前的高度
   * @param ratio 比例
   * @param direction 轮廓点标识
   * @param standard 基准模式
   * MARK 等比缩放需要修改createCoordinateStrategies，使单方向缩放时，可以更新另一个方向的尺寸
   */
  sameRatio({ movementX, movementY, width, height }, { ratio, direction }, standard: 'max' | 'min'| 'x' | 'y' = 'max') {
    const maxV = Math.max(movementX.value, movementY.value)
    const isX = maxV === movementX.value
    const singleDireX = ['l', 'r'].includes(direction) // 单方向横向拖动
    const singleDireY = ['t', 'b'].includes(direction) // 单方向纵向拖动
    if (singleDireX) {
      const newHeight = (width + movementX.value) / ratio
      movementY.value = newHeight - height
    } else if (singleDireY) {
      const newWidth = (height + movementY.value) * ratio
      movementX.value = newWidth - width
    } else {
      const newHeight = conditionExecute(isX, (width + movementX.value) / ratio, width + movementX.value)
      const newWidth = conditionExecute(!isX, (height + movementY.value) * ratio, height + movementY.value)
      conditionExecute(isX, movementY.value = newHeight - height, movementX.value = newWidth - width)
    }
  }

  createContourPoint (pointElements, direction) {
    return pointElements[direction] || (pointElements[direction] = document.createElement('div'))
  }
}
