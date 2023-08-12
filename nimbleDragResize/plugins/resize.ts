import { Plugin } from './index.ts'
import useMovePoint from '../useMovePoint.ts'
import {appendChild, transferControl} from '../utils/tools.ts'
import {
  createParentPosition,
  pointIsPressChangeCallback,
  initPointStyle,
  Direction,
  movePointCallback
} from '../utils/dragResize.ts'
import { watch } from 'vue'

const pointDefaultStyle: { [key: string]: string } = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #999',
  borderRadius: '50%',
  display: 'none',
  zIndex: '999',
  // pointerEvents: 'none' // 防止轮廓点干扰点击事件
}

// initialize the contour point - 初始化轮廓点
function initContourPoints (elementParameter, stateParameter, globalDataParameter, options, runtimeParameter) {
  const { target, pointElements } = elementParameter
  const { pointState } = stateParameter
  const { pointPosition } = runtimeParameter
  const { pointSize } = options
  const { initialTarget } = globalDataParameter

  for (const direction in pointPosition) {
    const point = createContourPoint(pointElements, { direction })
    initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize }, pointDefaultStyle)
    appendChild(target.value.parentNode, point)

    const isPress = addDragFunctionToPoint(elementParameter, stateParameter, globalDataParameter, options, { point, pointPosition, direction })
    // update the width and height information when releasing the mouse - 当释放鼠标时更新宽度和高度信息
    watch(isPress, pointIsPressChangeCallback(target.value, { initialTarget, pointState, direction }))
  }
}

// add drag and drop functionality for outline points - 为轮廓点添加拖放功能
function addDragFunctionToPoint (elementParameter, stateParameter, globalDataParameter, options, runTimeParameter) {
  const { target } = elementParameter
  const { point, pointPosition, direction } = runTimeParameter
  const { resizeCallback } = options.callbacks || {}
  const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
    const moveResizeAction = () => {
      // moveAction()
      movePointCallback(
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

// create contour points - 创建轮廓点
function createContourPoint (pointElements, { direction }) {
  return pointElements[direction] || (pointElements[direction] = document.createElement('div'))
}

class Resize implements Plugin {
  name
  constructor() {
    this.name = 'Resize'
  }
  init (elementParameter, stateParameter, globalDataParameter, options) {
    // const { skill = {} } = options
    // const { resize } = skill
    // if (!resize) return
    const pointPosition = createParentPosition(globalDataParameter.initialTarget, options.pointSize)
    initContourPoints(elementParameter, stateParameter, globalDataParameter, options, { pointPosition })
  }
  unbind (elementParameter, stateParameter, globalDataParameter, options) {
  }
}

export default new Resize()
