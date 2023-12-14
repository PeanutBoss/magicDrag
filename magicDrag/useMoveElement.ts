import { reactive, ref, toRef, readonly, computed } from '@vue/reactivity'
import { getElement, transferControl, throttle, baseWarnTips } from './utils/tools'
import { useWatchData, nextTick } from './helper'

/**
 * @description 移动元素
 * @param selector 要移动的元素或选择器
 * @param moveCallback 移动时的回调
 * @param moveOption 限制移动的配置项
 */
interface MoveOption {
  limitDirection?: 'X' | 'Y' | null
  throttleTime?: number
	offsetLeft?: number
	offsetTop?: number
}
function guaranteeAbsolute(el: HTMLElement) {
	return getComputedStyle(el).position === 'absolute'
		? null
		: el.style.position = 'absolute'
}

type Pos = {
	x?: number
	y?: number
}

type Callback = (defaultAction: Function, ...rest: any[]) => void

export function useMoveElement (
	selector: string | HTMLElement,
	callback: Callback | Record<'move' | 'down' | 'up', Callback> = () => {},
	moveOption: MoveOption = {}
) {
  const { limitDirection, throttleTime = 10, offsetLeft = 0, offsetTop = 0 } = moveOption

	let moveCallback, downCallback, upCallback
	if (callback && typeof callback === 'function') {
		moveCallback = callback
	} else if (callback && typeof callback === 'object') {
		moveCallback = callback.move
		downCallback = callback.down
		upCallback = callback.up
	}

	baseWarnTips(throttleTime >= 100, 'the throttleTime is greater than 100 and the visual effects may not be smooth')

  nextTick(initElement)

	let $ele
  // 鼠标状态
	const isPress = ref(false)
	// 按下鼠标时鼠标的坐标
	const startOffset = reactive({
		x: 0,
		y: 0
	})
	// 按下鼠标时元素的坐标
	const startCoordinate = reactive({
		x: 0,
		y: 0
	})
	// 元素移动的距离
	const movement = reactive({
		x: 0,
		y: 0
	})
	// 相对容器元素变化的偏移量
	const relativeContainer = reactive({
		x: 0,
		y: 0
	})
	const throttleMouseMove = throttle(mouseMove, 10, { leading: true })
	const watchMovement = useWatchData(movement, updatePosition)

	function initElement() {
		$ele = getElement(selector)
		guaranteeAbsolute($ele)
		$ele.addEventListener('mousedown', mouseDown)
	}
	function mouseUp () {
		const upAction = () => {
			changePress(false)
		}
		// 如果有回调将控制权交给回调，否则执行默认动作
		upCallback ? transferControl(upAction, upCallback) : upAction()
	}
	function mouseDown (event) {
		event.preventDefault()
		const downAction = () => {
			changePress(true)
			// 初始化鼠标移动的距离
			setMovement({ x: 0, y: 0 })
			// 更新计算元素的坐标
			setStartCoordinate({ x: $ele.offsetLeft, y: $ele.offsetTop })
			// 更新鼠标的坐标
			setStartOffset({ x: event.pageX, y: event.pageY })
			window.addEventListener('mousemove', throttleMouseMove)
			window.addEventListener('mouseup', mouseUp)
		}
		// 如果有回调将控制权交给回调，否则执行默认动作
		downCallback ? transferControl(downAction, downCallback) : downAction()
	}
	function mouseMove (event) {
		if (!isPress.value) return
		function moveAction() {
			event.preventDefault()
			// 如果有限制移动，则不更新movement和元素坐标
			isUpdateMovementX() && setMovement({ x: event.pageX - startOffset.x })
			isUpdateMovementY() && setMovement({ y: event.pageY - startOffset.y })
			arriveLeftBound() && setMovement({ x: offsetLeft - startCoordinate.x })
			arriveTopBound() && setMovement({ y: offsetTop - startCoordinate.y })
			updatePosition()
		}
		transferControl(moveAction, moveCallback, watchMovement)
	}
	function save() {
		relativeContainer.x = $ele.offsetLeft - startCoordinate.x
		relativeContainer.y = $ele.offsetTop - startCoordinate.y
	}
	function destroy() {
		$ele.removeEventListener('mousedown', mouseDown)
		window.removeEventListener('mousemove', throttleMouseMove)
		window.removeEventListener('mouseup', mouseUp)
		$ele = null
	}

	return {
		mouseX: computed(() => startOffset.x - startCoordinate.x),
		mouseY: computed(() => startOffset.y - startCoordinate.y),
		left: toRef(startCoordinate, 'x'),
		top: toRef(startCoordinate, 'y'),
		movementX: toRef(watchMovement, 'x'),
		movementY: toRef(watchMovement, 'y'),
		relContainerX: toRef(relativeContainer, 'x'),
		relContainerY: toRef(relativeContainer, 'y'),
    isPress: readonly(isPress),
		destroy
	}
	function updatePosition() {
		$ele.style.left = startCoordinate.x + movement.x + 'px'
		$ele.style.top = startCoordinate.y + movement.y + 'px'
	}
	function changePress(newStatus) {
		isPress.value = newStatus
	}
	function setMovement({ x, y }: Pos) {
		movement.x = x ?? movement.x
		movement.y = y ?? movement.y
	}
	function setStartOffset({ x, y }: Pos) {
		startOffset.x = x
		startOffset.y = y
	}
	function setStartCoordinate({ x, y }: Pos) {
		startCoordinate.x = x
		startCoordinate.y = y
	}
	function isUpdateMovementX() {
		return limitDirection !== 'X'
	}
	function isUpdateMovementY() {
		return limitDirection !== 'Y'
	}
	function arriveLeftBound() {
		return startCoordinate.x + movement.x < offsetLeft
	}
	function arriveTopBound() {
		return startCoordinate.y + movement.y < offsetTop
	}
}
