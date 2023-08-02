import { reactive, ref, toRef, nextTick, watch, readonly, onUnmounted } from "vue/dist/vue.esm-bundler.js";
import { getElement, transferControl } from './utils/tools.ts'
import { throttle } from 'lodash'

/**
 * @description 移动元素
 * @param selector 要移动的元素或选择器
 * @param moveCallback 移动时的回调
 * @param limitOption 限制移动的配置项
 */
interface moveOption {
  direction?: 'X' | 'Y' | null
  stopMovementX?: boolean
  stopMovementY?: boolean
  throttleTime?: number
}
export default function useMovePoint (selector: string | HTMLElement, moveCallback?, limitOption: moveOption = {}) {
  const { direction: limitDirection, stopMovementX = true, stopMovementY = true, throttleTime = 10 } = limitOption
  if (throttleTime >= 100) {
    console.warn('the throttleTime is greater than 100 and the visual effects may not be smooth')
  }
  nextTick(() => {
		$ele = getElement(selector)
		$ele.addEventListener('mousedown', mouseDown)
	})
  onUnmounted(() => {
    $ele.removeEventListener('mousedown', mouseDown)
    window.removeEventListener('mousedown', throttleMouseMove)
    window.removeEventListener('mouseup', mouseUp)
  })
	let $ele

	// 是否可以移动
  const stopCoordinate = reactive({
		x: true,
		y: true
	})
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
  const isUpdateMovementX = limitDirection !== 'X' && stopMovementX
  const isUpdateMovementY = limitDirection !== 'Y' && stopMovementY
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
  const throttleMouseMove = throttle(mouseMove, throttleTime, { leading: true })
	function mouseMove (event) {
    if (!isPress.value) return
    const moveAction = () => {
      // 取消文本选中
      event.preventDefault()
      // 如果有限制移动，则不更新movement和元素坐标
      isUpdateMovementX && (movement.x = event.pageX - startOffset.x)
      isUpdateMovementY && (movement.y = event.pageY - startOffset.y)
      // 如果不能移动，则更新movement但不更新元素坐标
      stopCoordinate.x && ($ele.style.left = startCoordinate.x + movement.x + 'px')
      stopCoordinate.y && ($ele.style.top = startCoordinate.y + movement.y + 'px')
    }
    transferControl(moveAction, moveCallback, movement)
	}
	function mouseUp () {
		isPress.value = false
	}
  watch(movement, () => {
    $ele.style.left = stopCoordinate.x && startCoordinate.x + movement.x + 'px'
    $ele.style.top = stopCoordinate.y && startCoordinate.y + movement.y + 'px'
  })
	return {
		preStartX: toRef(startOffset, 'x'),
		preStartY: toRef(startOffset, 'y'),
		left: toRef(startCoordinate, 'x'),
		top: toRef(startCoordinate, 'y'),
		movementX: toRef(movement, 'x'),
		movementY: toRef(movement, 'y'),
    isPress: readonly(isPress),
    stopCoordinate
	}
}
