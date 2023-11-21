import { watch } from '@vue/runtime-core'
import { setStyle, transferControl } from '../utils/tools'
import { useMoveElement } from '../useMoveElement'
import {saveDownPointPosition, updateContourPointPosition, updateInitialTarget, updateState} from '../common/magicDrag'
import {State, PluginManager, splitState} from './index'
import globalData, {addGlobalUnmountCb} from '../common/globalData'

export default class Draggable {
	constructor(private plugins: PluginManager = new PluginManager, parameter: State, private stateManager) {
		this.start(stateManager.currentState)
	}

	// start({ elementParameter, stateParameter, globalDataParameter, optionParameter }) {
	start(currentState) {
		const {
			pointElements, target, targetState, containerInfo,
			initialTarget, downPointPosition,
			drag, limitDragDirection, dragCallback
		} = splitState(currentState)

		// modify the icon for the hover state - 修改悬停状态的图标
		drag && setStyle(target.value, 'cursor', 'all-scroll')
		const { movementX, movementY, isPress, destroy } = useMoveElement(
			target.value,
			this.moveTargetCallback(dragCallback, {
				downPointPosition, pointElements, targetState, containerInfo
			}),
			{ limitDirection: limitDragDirection, offsetLeft: containerInfo.offsetLeft, offsetTop: containerInfo.offsetTop }
		)
		addGlobalUnmountCb(destroy)

		watch(isPress, this.isPressChangeCallback(
      { ...currentState.elementParameter },
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
			const parameter = this.stateManager.currentState
			const initialTarget = parameter.globalDataParameter.initialTarget

			const _updateContourPointPosition = movement => {
				updateContourPointPosition(downPointPosition, movement, pointElements)
			}
			const _updateState = movement => {
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
		}
	}

	// 限制容器内移动
	limitTargetMove (initialTarget, containerInfo, movement) {
		const { left, top, width: targetWidth , height: targetHeight } = initialTarget
		const { width: containerWidth, height: containerHeight, offsetLeft, offsetTop } = containerInfo

		comeAcrossLeft() && (movement.x = -left)
		comeAcrossTop() && (movement.y = -top)
		comeAcrossRight() && (movement.x = containerWidth + offsetLeft - targetWidth - left)
		comeAcrossBottom() && (movement.y = containerHeight + offsetTop - targetHeight - top)
		// containerWidth + offsetLeft, containerHeight + offsetTop 是计算过容器元素相对body偏移之后的位置
		function comeAcrossLeft() {
			return movement.x + left <= 0
		}
		function comeAcrossRight() {
			return movement.x + left + targetWidth >= containerWidth + offsetLeft
		}
		function comeAcrossTop() {
			return movement.y + top <= 0
		}
		function comeAcrossBottom() {
			return movement.y + top + targetHeight >= containerHeight + offsetTop
		}
	}

	targetMouseDown({ downPointPosition, pointElements }) {
		saveDownPointPosition({ downPointPosition, pointElements })
	}

	targetMouseUp({ initialTarget, movementX, movementY }) {
		// mouse up to update the coordinates of the target element
		// 鼠标抬起时更新目标元素的坐标数据
		updateInitialTarget(initialTarget, { top: initialTarget.top + movementY.value, left: initialTarget.left + movementX.value })
	}

	isPressChangeCallback(elementParameter, { targetState }, { downPointPosition, initialTarget }, { movementX, movementY }) {
		return (newV) => {
			updateState(targetState, 'isPress', newV)
			if (newV) {
				this.targetMouseDown({ downPointPosition, pointElements: elementParameter.pointElements })
			} else {
				this.targetMouseUp({ initialTarget, movementX, movementY })
			}

      this.plugins.callExtensionPoint('targetPressChange', newV, elementParameter)
		}
	}
}
