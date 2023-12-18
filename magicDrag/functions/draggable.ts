import { watch } from '@vue/runtime-core'
import { numberToStringSize, setStyle, transferControl } from '../utils/tools'
import { useMoveElement } from '../useMoveElement'
import { saveDownPointPosition, updateContourPointPosition, updateInitialTarget, updateState } from '../common/magicDrag'
import { PluginManager } from '../manager'
import { addGlobalUnmountCb } from '../common/globalData'

/*
* RSStartCoordinate composeCoordinate 在draggable中限制边界的时候需要用
* 但是在regionalSelection中更合理
* */
export default class Draggable {
	// 所有被选中的元素的坐标 放到regionalSelection中
	private RSStartCoordinate: { left: number, top: number, width: number, height: number, el?: HTMLElement }[] = []
	// 被选中的元素轮廓的坐标 保留到draggable中
	private composeCoordinate: { left: number, top: number, width: number, height: number, el?: HTMLElement }
	constructor(private plugins: PluginManager = new PluginManager, private stateManager) {
		this.start(stateManager.currentState)
	}

	start(currentState) {
		const _this = this
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
				down: (downAction, event) => {
					downAction()
          this.stateManager.setCurrentElement(event.target)
					// 按下的时候记录被区域选中的组件的初始位置
					saveStartCoordinate()
					// 计算所有选中元素轮廓的坐标
					executeComposeCoordinate()
          this.dragStart({ resetRegionalSelectionData })
					function executeComposeCoordinate() {
						// 如果RSStartCoordinate.length <= 1 说明没有多选元素
						if (!_this.stateManager.isRegionSelection) return
						const left = Math.min(..._this.RSStartCoordinate.map(m => m.left))
						const top = Math.min(..._this.RSStartCoordinate.map(m => m.top))
						_this.composeCoordinate = {
							left,
							top,
							width: Math.max(..._this.RSStartCoordinate.map(m => m.left + m.width)) - left,
							height: Math.max(..._this.RSStartCoordinate.map(m => m.top + m.height)) - top
						}
					}
          function saveStartCoordinate() {
						console.log(_this.stateManager.regionSelectedState, '_this.stateManager.regionSelectedState')
            _this.stateManager.regionSelectedState.forEach(item => {
              _this.RSStartCoordinate.push({ ...item.coordinate, el: item.privateTarget })
            })
          }
				},
				up: upAction => {
					upAction()
					// 清除提供给区域选择框的数据
					resetRegionalSelectionData()
          this.dragEnd()
				}
			},
			{ limitDirection: limitDragDirection, offsetLeft: containerInfo.paddingLeft, offsetTop: containerInfo.paddingTop }
		)
		addGlobalUnmountCb(destroy)

		watch(isPress, this.isPressChangeCallback(
      { pointElements, allTarget, privateTarget },
			{ targetState },
			{ downPointPosition, coordinate },
			{ movementX, movementY }
		))
		function resetRegionalSelectionData() {
			_this.composeCoordinate = null
			_this.RSStartCoordinate.length = 0
		}
	}

	dragStart({ resetRegionalSelectionData }) {
		// 在拖拽开始时触发扩展点，通知插件
		this.plugins.callExtensionPoint(
			'dragStart',
			{
				composeCoordinate: this.composeCoordinate,
				publicContainer: this.stateManager.currentState.publicContainer.value,
				privateTarget: this.stateManager.currentElement,
				resetRegionalSelectionData
			}
		)
	}
	dragEnd() {
		this.plugins.callExtensionPoint(
			'dragEnd',
			{ publicContainer: this.stateManager.currentState.publicContainer.value }
		)
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
				this.limitTargetMove(executeCoordinate(), containerInfo, movement)
				// update the position of the contour points
				// 更新轮廓点位置
				_updateContourPointPosition(movement)
				// update the state of the target element - 更新目标元素状态
				_updateState(movement)
				// 同步被多选的其他元素的状态和样式（位置）
				syncOtherEl(movement)
				// 获取当前拖拽元素的坐标（多选的情况下需要重新计算坐标，单选直接返回coordinate）
				function executeCoordinate() {
					return _this.stateManager.isRegionSelection ? _this.composeCoordinate : coordinate
				}
			}
			// Hand over control (moveTargetAction)
			// 将控制权（moveTargetAction）交出
			transferControl(moveTargetAction, dragCallback, { movementX: movement.x, movementY: movement.y })

			this.plugins.callExtensionPoint(
				'drag',
				{ allTarget, privateTarget },
				{ movement, _updateContourPointPosition, _updateState, syncOtherEl }
			)

			// 需要更新其他元素位置和状态 TODO 其他元素抵达边界时需要限制
			function syncOtherEl(movement) {
				// 多选的情况下才需要做同步操作
				if (_this.stateManager.isRegionSelection) {
					// 更新其余被区域选中的元素样式
					updateOtherElStyle()
					// 更新其余被区域选中的元素状态
					updateOtherElState()
				}
				function updateOtherElStyle() {
					_this.stateManager.regionSelectedElement.forEach(el => {
						if (el === _this.stateManager.currentElement) return
						const startCoordinate = _this.RSStartCoordinate.find(item => item.el === el)
						if (startCoordinate) setStyle(el, numberToStringSize({
							left: startCoordinate.left + movement.x,
							top: startCoordinate.top + movement.y })
						)
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
		const { width: containerWidth, height: containerHeight, paddingTop, paddingLeft } = containerInfo

		arriveLeft() && (movement.x = -left)
		arriveTop() && (movement.y = -top)
		arriveRight() && (movement.x = containerWidth + paddingLeft - targetWidth - left)
		arriveBottom() && (movement.y = containerHeight + paddingTop - targetHeight - top)
		// containerWidth + offsetLeft, containerHeight + offsetTop 是计算过容器元素相对body偏移之后的位置
		function arriveLeft() {
			return movement.x + left <= 0
		}
		function arriveRight() {
			return movement.x + left + targetWidth >= containerWidth + paddingLeft
		}
		function arriveTop() {
			return movement.y + top <= 0
		}
		function arriveBottom() {
			return movement.y + top + targetHeight >= containerHeight + paddingTop
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
