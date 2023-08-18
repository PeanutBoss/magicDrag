import { Plugin } from './index.ts'
import useMoveElement from '../useMoveElement.ts'
import { moveTargetCallback, updateInitialTarget } from '../utils/magicDrag.ts'
import { watch } from 'vue'
import { setStyle } from '../utils/tools.ts'

function isPressChangeCallback ({ pointElements }, { targetState }, { downPointPosition, initialTarget }, { movementX, movementY }) {
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
			// TODO　隐藏参考线
    }
  }
}

class Drag implements Plugin {
  public name
  constructor () {
    this.name = 'Drag'
  }
	init ({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
		// console.log(elementParameter, stateParameter, globalDataParameter, options)
    const { pointElements, target } = elementParameter
    const { targetState } = stateParameter
    const { containerInfo, initialTarget, downPointPosition } = globalDataParameter
    const { skill = {}, callbacks = {} } = optionParameter
    const { drag, limitDragDirection } = skill
    const { dragCallback } = callbacks

		// modify the icon for the hover state - 修改悬停状态的图标
		drag && setStyle(target.value, 'cursor', 'all-scroll')

		const { movementX, movementY, isPress } = useMoveElement(
			target.value,
			moveTargetCallback(dragCallback, {
				downPointPosition, pointElements, targetState, containerInfo
			}),
			{ direction: limitDragDirection })

		watch(isPress, isPressChangeCallback(
      {pointElements},
      { targetState },
      { downPointPosition, initialTarget },
      { movementX, movementY }
    ))
	}
	unbind ({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
	}
}

export default new Drag()
