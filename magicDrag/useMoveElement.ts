import { reactive, ref, toRef, readonly, computed } from '@vue/reactivity'
import { getElement, transferControl, throttle } from './utils/tools'
import { useWatchData, nextTick, watchIsPress } from './helper'

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
export function useMoveElement (selector: string | HTMLElement, moveCallback?, moveOption: MoveOption = {}) {
  const { limitDirection, throttleTime = 10, offsetLeft = 0, offsetTop = 0 } = moveOption
  if (throttleTime >= 100) {
    console.warn('the throttleTime is greater than 100 and the visual effects may not be smooth')
  }
  nextTick(() => {
		$ele = getElement(selector)
		guaranteeAbsolute($ele)
		$ele.addEventListener('mousedown', mouseDown)
	})
	function destroy() {
		$ele.removeEventListener('mousedown', mouseDown)
		window.removeEventListener('mousedown', throttleMouseMove)
		window.removeEventListener('mouseup', mouseUp)
		$ele = null
	}
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
  const isUpdateMovementX = limitDirection !== 'X'
  const isUpdateMovementY = limitDirection !== 'Y'
	function mouseDown (event) {
    event.preventDefault()
		isPress.value = true
    // 初始化鼠标移动的距离
		movement.x = 0
		movement.y = 0
    // 更新计算元素的坐标
		startCoordinate.x = $ele.offsetLeft
		startCoordinate.y = $ele.offsetTop
    // 更新鼠标的坐标
		startOffset.x = event.pageX
		startOffset.y = event.pageY
		window.addEventListener('mousemove', throttleMouseMove)
		window.addEventListener('mouseup', mouseUp)
	}
  const throttleMouseMove = throttle(mouseMove, 10, { leading: true })
  // const throttleMouseMove = mouseMove
	function mouseMove (event) {
    if (!isPress.value) return
    const moveAction = () => {
      // 取消文本选中
      event.preventDefault()
			// console.log(startCoordinate.x,  movement.x, minLeft, 'startCoordinate.x, movement.x, minLeft')
      // 如果有限制移动，则不更新movement和元素坐标
      isUpdateMovementX && (movement.x = event.pageX - startOffset.x)
      isUpdateMovementY && (movement.y = event.pageY - startOffset.y)

			if (startCoordinate.x + movement.x < offsetLeft) {
				movement.x = offsetLeft - startCoordinate.x
			}
			if (startCoordinate.y + movement.y < offsetTop) {
				movement.y = offsetTop - startCoordinate.y
			}

      // 如果不能移动，则更新movement但不更新元素坐标
      $ele.style.left = startCoordinate.x + movement.x + 'px'
      $ele.style.top = startCoordinate.y + movement.y + 'px'
    }
    transferControl(moveAction, moveCallback, watchMovement)
	}
	function mouseUp () {
		isPress.value = false
	}

	const watchMovement = useWatchData(movement, updatePosition)

	function updatePosition() {
		$ele.style.left = startCoordinate.x + movement.x + 'px'
		$ele.style.top = startCoordinate.y + movement.y + 'px'
	}

	return {
		mouseX: computed(() => startOffset.x - startCoordinate.x),
		mouseY: computed(() => startOffset.y - startCoordinate.y),
		left: toRef(startCoordinate, 'x'),
		top: toRef(startCoordinate, 'y'),
		movementX: toRef(watchMovement, 'x'),
		movementY: toRef(watchMovement, 'y'),
    isPress: readonly(isPress),
		destroy
	}
}
