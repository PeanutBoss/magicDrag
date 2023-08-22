import { PluginBlueprint } from '../../pluginBlueprint/pluginManager.ts'
import {setStyle, transferControl} from '../utils/tools.ts'
import useMoveElement from '../useMoveElement.ts'
import {updateContourPointPosition, updateInitialTarget, updateState} from '../utils/magicDrag.ts'
import {watch} from 'vue'
import {getCurrentParameter, Parameter} from '../utils/parameter.ts'
import {executeActionCallbacks, getActionCallbacks} from '../plugins/contextMenu/actionMap.ts'

const dragActions = getActionCallbacks('dragCallbacks')

export default class Draggable {
	constructor(private plugins: PluginBlueprint.PluginManager = new PluginBlueprint.PluginManager, parameter: Parameter) {
		this.init(parameter)
	}

	init({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
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
			this.moveTargetCallback(dragCallback, {
				downPointPosition, pointElements, targetState, containerInfo
			}),
			{ direction: limitDragDirection })

		watch(isPress, this.isPressChangeCallback(
			{pointElements},
			{ targetState },
			{ downPointPosition, initialTarget },
			{ movementX, movementY }
		))
	}

	dragStart() {
		// 在拖拽开始时触发扩展点，通知插件
		this.plugins.callExtensionPoint('onDragStart')
	}

	moveTargetCallback(dragCallback, { downPointPosition, pointElements, targetState, containerInfo }) {
		return (moveAction, movement) => {
			const parameter = getCurrentParameter()
			const initialTarget = parameter.globalDataParameter.initialTarget
			// 如果目标元素处于锁定状态则不允许拖拽
			const isContinue = executeActionCallbacks(dragActions, initialTarget, 'beforeCallback')
			if (isContinue === false) return

			const _updateContourPointPosition = (movement) => {
				updateContourPointPosition(downPointPosition, movement, pointElements)
			}
			const _updateState = (movement) => {
				updateState(targetState, { left: initialTarget.left + movement.x, top: initialTarget.top + movement.y })
			}

			// Wrap the action to move the target element as a separate new function, and if the user defines a callback
			// use moveTargetAction as an argument to that callback
			// 将移动目标元素的操作包装为单独新的函数,如果用户有定义回调，则将moveTargetAction作为这个回调的参数
			const moveTargetAction = () => {
				// perform the default action for movePoint
				// 执行movePoint的默认动作
				moveAction()
				// 限制目标元素在容器内移动
				this.limitTargetMove(initialTarget, containerInfo, movement)
				// update the position of the contour points
				// 更新轮廓点位置
				_updateContourPointPosition(movement)

				// update the state of the target element - 更新目标元素状态
				_updateState(movement)
			}
			// Hand over control (moveTargetAction)
			// 将控制权（moveTargetAction）交出
			transferControl(moveTargetAction, dragCallback, { movementX: movement.x, movementY: movement.y })

			this.plugins.callExtensionPoint('drag', parameter, { movement, _updateContourPointPosition, _updateState })

			executeActionCallbacks(dragActions, initialTarget, 'afterCallback')
		}
	}

	// 限制容器内移动
	limitTargetMove (initialTarget, containerInfo, movement) {
		const { left, top, width: targetWidth , height: targetHeight } = initialTarget
		const { width: containerWidth, height: containerHeight } = containerInfo

		const comeAcrossLeft = movement.x + left <= 0
		const comeAcrossTop = movement.y + top <= 0
		const comeAcrossRight = movement.x + left + targetWidth >= containerWidth
		const comeAcrossBottom = movement.y + top + targetHeight >= containerHeight

		comeAcrossLeft && (movement.x = -left)
		comeAcrossTop && (movement.y = -top)
		comeAcrossRight && (movement.x = containerWidth - targetWidth - left)
		comeAcrossBottom && (movement.y = containerHeight - targetHeight - top)
	}

	targetMouseDown({ downPointPosition, pointElements }) {
		// the coordinates of all contour points are recorded when the target element is pressed
		// 当按下目标元素时，记录所有轮廓点的坐标
		for (const key in pointElements) {
			downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
		}
	}

	targetMouseUp({ initialTarget, movementX, movementY }) {
		// mouse up to update the coordinates of the target element
		// 鼠标抬起时更新目标元素的坐标
		updateInitialTarget(initialTarget, { top: initialTarget.top + movementY.value, left: initialTarget.left + movementX.value })
		// TODO　隐藏参考线
	}

	isPressChangeCallback({ pointElements }, { targetState }, { downPointPosition, initialTarget }, { movementX, movementY }) {
		return (newV) => {
			this.updateState(targetState, 'isPress', newV)
			if (newV) {
				this.targetMouseDown({ downPointPosition, pointElements })
			} else {
				this.targetMouseUp({ initialTarget, movementX, movementY })
			}
			// MARK 通知插件鼠标状态更新了
		}
	}
	// TODO 复用其他
	updateState(state, key: object | string, value?) {
		if (typeof key === 'object') {
			Object.assign(state, key)
		} else {
			state[key] = value
		}
	}
}
