import {nextTick, onMounted, Ref, ref} from 'vue'
import { getElement, getDirectionKey } from './tool.ts'

interface MovePointerParams {
	process: string | HTMLElement
	processPlayed: string | HTMLElement
	processPointer: string | HTMLElement
	direction: 'X' | 'Y'
}

interface MoveDistance {
	startOffset: Ref<number> // 按下鼠标时鼠标的相对位置
	startSize: Ref<number> // 按下鼠标时的位置与进度条最左/顶端的距离（按下鼠标时$processPlayed的宽/高度）
	currentPosition: Ref<number> // pointer相对于左/顶端点的位置（进度）
	totalSize: Ref<number> // 进度条总宽度/高度
	isPress: Ref<boolean> // 是否按下
	pointerOffset: Ref<number> // 指示点的尺寸
}

export function useMovePointer ({ process, processPlayed, processPointer, direction }: MovePointerParams):MoveDistance {
	let $process, $processPlayed, $processPointer

	onMounted(() => {
		$process = getElement(process)
		$processPlayed = getElement(processPlayed)
		$processPointer = getElement(processPointer)
		totalSize.value = $process.offsetWidth
    addEvent()
		$process.onmouseenter = getPointerOffset
	})
	const { startDistanceKey, sizeKey, offsetKey, pageKey } = getDirectionKey(direction)

	const startOffset = ref(0)
	const startSize = ref(0)
	const isPress = ref(false)
	const currentPosition = ref(0)
	const totalSize = ref(0)
	const pointerOffset = ref(0)

  function addEvent () {
    $process.addEventListener('mousedown', downProcess)
    $processPointer.addEventListener('mousedown', downPointer)
  }

	function getPointerOffset () {
		nextTick(() => {
			pointerOffset.value = $processPointer.offsetWidth
		}).finally()
	}

	// 点击进度条调整进度
	function downProcess (event) {
		// 因为process和processPlayed元素的左侧在同一个位置，所以他们的offsetX相同，无需特殊处理processPlayed
		if (event.target === $processPointer) return
		setTargetPosition(event[offsetKey])
	}

	// 点击进度指示点
	function downPointer (event) {
		// 计算点击的位置与 processPlayed 右端的距离
		const targetPosition = event[offsetKey] + $processPlayed[sizeKey] - pointerOffset.value / 2
		setTargetPosition(targetPosition)

		isPress.value = true
		// 鼠标按下时修改相对位置
		startOffset.value = event[pageKey]
		// 事件目标是$processPointer，它的offsetLeft要比$processPlayed左移了4个单位
		startSize.value = event.target[startDistanceKey] + pointerOffset.value / 2

		window.onmousemove = movePointer
		window.onmouseup = () => {
			isPress.value = false
		}
	}

	// 移动进度指示点
	function movePointer (event) {
		if (!isPress.value) return
		const currentPointX = event[pageKey] - startOffset.value + startSize.value
		// 保存偏移量
		currentPosition.value = startSize.value + (event[pageKey] - startOffset.value)

		if (currentPosition.value <= 0) {
			setTargetPosition(0)
			return
		} else if (currentPosition.value >= totalSize.value) {
			setTargetPosition(totalSize.value)
			return
		}

		setTargetPosition(currentPointX)
	}

	function setTargetPosition (x: number) {
		// TODO left width
		$processPointer.style.left = x - pointerOffset.value / 2 + 'px'
		$processPlayed.style.width = x + 'px'
	}

	return {
		startOffset,
		startSize,
		isPress,
		currentPosition,
		totalSize,
		pointerOffset
	}
}
