import { watch } from '@vue/runtime-core'
import { setStyle, transferControl } from '../utils/tools'
import { useMoveElement } from '../useMoveElement'
import {saveDownPointPosition, updateContourPointPosition, updateInitialTarget, updateState} from '../common/magicDrag'
import { State, PluginManager } from '../manager'
import {addGlobalUnmountCb} from '../common/globalData'

export default class Draggable {
	// regionSelected start coordinate
	private RSStartCoordinate: { left: number, top: number, width: number, height: number, el?: HTMLElement }[] = []
	constructor(private plugins: PluginManager = new PluginManager, private stateManager) {
		this.start(stateManager.currentState)
	}

	start(currentState) {
		const {
			pointElements, targetState, containerInfo, publicTarget,
			downPointPosition, allTarget, privateTarget,
			drag, dragCallback,
			coordinate
		} = currentState
		const { limitDragDirection } = currentState.options.skill

		// modify the icon for the hover state - 修改悬停状态的图标
		drag && setStyle(publicTarget.value, 'cursor', 'all-scroll')
		const { movementX, movementY, isPress, destroy } = useMoveElement(
			publicTarget.value,
			{
				move: this.moveTargetCallback(dragCallback, {
					downPointPosition, pointElements, targetState, containerInfo
				}),
				down: downAction => {
					downAction()
					// 按下的时候记录被区域选中的组件的初始位置
					this.stateManager.regionSelectedState.forEach(item => {
						this.RSStartCoordinate.push({ ...item.coordinate, el: item.privateTarget })
					})
				},
				up: upAction => {
					upAction()
					// 鼠标抬起时候清空记录的数据
					this.RSStartCoordinate.length = 0
				}
			},
			{ limitDirection: limitDragDirection, offsetLeft: containerInfo.offsetLeft, offsetTop: containerInfo.offsetTop }
		)
		addGlobalUnmountCb(destroy)

		watch(isPress, this.isPressChangeCallback(
      { pointElements, allTarget, privateTarget },
			{ targetState },
			{ downPointPosition, coordinate },
			{ movementX, movementY }
		))
	}

	dragStart() {
		// 在拖拽开始时触发扩展点，通知插件
		this.plugins.callExtensionPoint('onDragStart')
	}

	moveTargetCallback(dragCallback, { downPointPosition, pointElements, targetState, containerInfo }) {
		const _this = this
		return (moveAction, movement) => {
			const { coordinate, allTarget, privateTarget } = this.stateManager.currentState

			const _updateContourPointPosition = movement => updateContourPointPosition(downPointPosition, movement, pointElements)
			const _updateState = movement => updateState(targetState, { left: coordinate.left + movement.x, top: coordinate.top + movement.y })

			// Wrap the action to move the target element as a separate new function, and if the user defines a callback
			// use moveTargetAction as an argument to that callback
			// 将移动目标元素的操作包装为单独新的函数,如果用户有定义回调，则将moveTargetAction作为这个回调的参数
			const moveTargetAction = () => {
				// perform the default action for movePoint
				// 执行movePoint的默认动作
				moveAction()
				// 限制目标元素在容器内移动
				this.limitTargetMove(coordinate, containerInfo, movement)
				// update the position of the contour points
				// 更新轮廓点位置
				_updateContourPointPosition(movement)
				// update the state of the target element - 更新目标元素状态
				_updateState(movement)
				// 更新被多选的其他元素的状态和样式（位置）
				updateOtherEl(movement)
			}
			// Hand over control (moveTargetAction)
			// 将控制权（moveTargetAction）交出
			transferControl(moveTargetAction, dragCallback, { movementX: movement.x, movementY: movement.y })

			this.plugins.callExtensionPoint('drag', { allTarget, privateTarget }, { movement, _updateContourPointPosition, _updateState, updateOtherEl })

			// 需要更新其他元素位置和状态 TODO 其他元素抵达边界时需要限制
			function updateOtherEl(movement) {
				if (needMoveOtherEl()) {
					// 更新其余被区域选中的元素样式
					updateOtherElStyle()
					// 更新其余被区域选中的元素状态
					updateOtherElState()
				}
				function needMoveOtherEl() {
					return _this.stateManager.regionSelectedElement.length > 1
				}
				function updateOtherElStyle() {
					_this.stateManager.regionSelectedElement.forEach(el => {
						if (el === _this.stateManager.currentElement) return
						const startCoordinate = _this.RSStartCoordinate.find(item => item.el === el)
						if (startCoordinate) {
							el.style.left = startCoordinate.left + movement.x + 'px'
							el.style.top = startCoordinate.top + movement.y + 'px'
						}
					})
				}
				function updateOtherElState() {
					_this.stateManager.regionSelectedState.forEach(state => {
						if (state.privateTarget === _this.stateManager.currentElement) return
						const startCoordinate = _this.RSStartCoordinate.find(item => item.el === state.privateTarget)
						if (startCoordinate) {
							_this.stateManager.setStateByEle(state.privateTarget, 'coordinate',
								{ ...state.coordinate, left: startCoordinate.left + movement.x, top: startCoordinate.top + movement.y }
							)
						}
					})
				}
			}
		}
	}

	// 限制容器内移动
	limitTargetMove (coordinate, containerInfo, movement) {
		const { left, top, width: targetWidth , height: targetHeight } = coordinate
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

	targetMouseUp({ coordinate, movementX, movementY }) {
		// mouse up to update the coordinates of the target element
		// 鼠标抬起时更新目标元素的坐标数据
		updateInitialTarget(coordinate, { top: coordinate.top + movementY.value, left: coordinate.left + movementX.value })
	}

	isPressChangeCallback({ pointElements, allTarget, privateTarget }, { targetState }, { downPointPosition, coordinate }, { movementX, movementY }) {
		return (newV) => {
			updateState(targetState, 'isPress', newV)
			if (newV) {
				this.targetMouseDown({ downPointPosition, pointElements })
			} else {
				this.targetMouseUp({ coordinate, movementX, movementY })
			}

      this.plugins.callExtensionPoint('targetPressChange', newV, { allTarget, privateTarget })
		}
	}
}
