import { PluginBlueprint } from "../../pluginBlueprint/pluginManager.ts";
import {Parameter} from "../utils/parameter.ts";
import {
  createParentPosition,
  Direction,
  initPointStyle,
  movePointCallback,
  pointIsPressChangeCallback
} from "../utils/magicDrag.ts";
import {addClassName, appendChild, transferControl} from "../utils/tools.ts";
import {watch} from "vue";
import useMoveElement from "../useMoveElement.ts";

function createContourPoint (pointElements, { direction }) {
  return pointElements[direction] || (pointElements[direction] = document.createElement('div'))
}

// initialize the contour point - 初始化轮廓点
function initContourPoints (elementParameter, stateParameter, globalDataParameter, options, runtimeParameter) {
  const { target, pointElements } = elementParameter
  const { pointState } = stateParameter
  const { pointPosition } = runtimeParameter
  const { pointSize, customClass: { customPointClass } } = options
  const { initialTarget } = globalDataParameter

  for (const direction in pointPosition) {
    const point = createContourPoint(pointElements, { direction })
    initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize })
    // addClassName(point, ClassName.OutlinePoint)
    addClassName(point, customPointClass)
    appendChild(target.value.parentNode, point)

    const isPress = addDragFunctionToPoint(elementParameter, stateParameter, globalDataParameter, options, { point, pointPosition, direction })
    // update the width and height information when releasing the mouse - 当释放鼠标时更新宽度和高度信息
    watch(isPress, pointIsPressChangeCallback(target.value, { initialTarget, pointState, direction }))
  }
}

function addDragFunctionToPoint (elementParameter, stateParameter, globalDataParameter, options, runTimeParameter) {
  const { target } = elementParameter
  const { point, pointPosition, direction } = runTimeParameter
  const { resizeCallback } = options.callbacks || {}
  const { isPress, movementX, movementY } = useMoveElement(point, (moveAction) => {
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

export default class Resizeable {
  constructor(plugins: PluginBlueprint.PluginManager = new PluginBlueprint.PluginManager(), parameter: Parameter) {
    this.init(parameter)
  }
  init({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
    const pointPosition = createParentPosition(globalDataParameter.initialTarget, optionParameter.pointSize)
    initContourPoints(elementParameter, stateParameter, globalDataParameter, optionParameter, { pointPosition })
  }
}
