import { reactive, ref, toRef, nextTick, watch } from "vue/dist/vue.esm-bundler.js";
import { getElement } from '../utils/tools.ts'

/*
* TODO 测试文本选中
* */

/**
 * @description 移动点
 * @param selector 要移动的元素或选择器
 * @param moveCallback 移动时的回调
 * @param limitDirection 限制不允许移动的方向
 */
export default function useMovePoint (selector: string | HTMLElement, moveCallback?, limitDirection?: 'X' | 'Y' | null) {
  nextTick(() => {
		$ele = getElement(selector)
		$ele.onmousedown = mouseDown
	})
	let $ele

	// 是否可以移动
  const canIMove = reactive({
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
	function mouseDown (event) {
    // event.preventDefault()
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
		window.onmousemove = mouseMove
		window.onmouseup = mouseUp
	}
	function mouseMove (event) {
    if (!isPress.value) return
    const moveAction = () => {
      // 取消文本选中
      event.preventDefault()
      // 如果有限制移动，则不更新movement和元素坐标
      limitDirection !== 'X' ? movement.x = event.pageX - startOffset.x : ''
      limitDirection !== 'Y' ? movement.y = event.pageY - startOffset.y : ''
      // 如果不能移动，则更新movement但不更新元素坐标
      canIMove.x && ($ele.style.left = startCoordinate.x + movement.x + 'px')
      canIMove.y && ($ele.style.top = startCoordinate.y + movement.y + 'px')
    }
    moveCallback ? moveCallback(moveAction) : moveAction()
	}
	function mouseUp () {
		isPress.value = false
	}
  watch(movement, () => {
    $ele.style.left = startCoordinate.x + movement.x + 'px'
    $ele.style.top = startCoordinate.y + movement.y + 'px'
  })
	return {
		preStartX: toRef(startOffset, 'x'),
		preStartY: toRef(startOffset, 'y'),
		left: toRef(startCoordinate, 'x'),
		top: toRef(startCoordinate, 'y'),
		movementX: toRef(movement, 'x'),
		movementY: toRef(movement, 'y'),
    isPress,
    canIMove
	}
}
