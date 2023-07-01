import { nextTick, onMounted, Ref, ref, computed } from 'vue'
import { getElement, getDirectionKey } from './tool.ts'

interface MovePointerParams {
	process: string | HTMLElement
	processPlayed: string | HTMLElement
	processPointer: string | HTMLElement
	direction: 'X' | 'Y'
}

interface MoveDistance {
	startOffset: Ref<number> // 按下鼠标时鼠标的相对文档最左/顶端的距离
	startSize: Ref<number> // 按下鼠标前的位置与进度条最左/顶端的距离（按下鼠标时$processPlayed的宽/高度）
	currentPosition: Ref<number> // pointer相对于左/顶端点的位置（进度）
	totalSize: Ref<number> // 进度条总宽度/高度
	isPress: Ref<boolean> // 是否按下
	pointSize: Ref<number> // 指示点的尺寸
	changeSize: Ref<number> // 进度变化量
}

export function useMovePointer ({ process, processPlayed, processPointer, direction }: MovePointerParams):MoveDistance {
	let $process, $processPlayed, $processPointer

	onMounted(() => {
		$process = getElement(process)
		$processPlayed = getElement(processPlayed)
		$processPointer = getElement(processPointer)
		totalSize.value = $process[sizeKey]
    addEvent()
		$process.onmouseenter = getPointerOffset
	})
	const { startDistanceKey, sizeKey, offsetKey, pageKey } = getDirectionKey(direction)

	const startOffset = ref(0)
	const startSize = ref(0)
	const isPress = ref(false)
	const currentPosition = ref(0)
	const totalSize = ref(0)
	const pointSize = ref(0)
	const changeSize = computed(() => currentPosition.value - startSize.value)

  function addEvent () {
    $process.addEventListener('mousedown', downProcess)
    $processPointer.addEventListener('mousedown', downPointer)
  }

	function getPointerOffset () {
		nextTick(() => {
			pointSize.value = $processPointer[sizeKey]
		}).finally()
	}

	// 点击进度条调整进度
	function downProcess (event) {
		// 因为process和processPlayed元素的左侧在同一个位置，所以他们的offsetX相同，无需特殊处理processPlayed
		if (event.target === $processPointer) return
		startSize.value = $processPlayed[sizeKey]
		setTargetPosition(event[offsetKey])
	}

	// 点击进度指示点
	function downPointer (event) {
		// 不能小于0或大于totalSize
		if (
			currentPosition.value + event[offsetKey] < pointSize.value / 2
			|| currentPosition.value + event[offsetKey] > totalSize.value + pointSize.value / 2
		) return
		// 计算点击的位置与 processPlayed 右端的距离
		const targetPosition = event[offsetKey] + $processPlayed[sizeKey] - pointSize.value / 2
		setTargetPosition(targetPosition)

		isPress.value = true
		// 鼠标按下时修改相对位置
		startOffset.value = event[pageKey]
		// 事件目标是$processPointer，它的offsetLeft要比$processPlayed左移了 pointSize.value/2 个单位
		startSize.value = event.target[startDistanceKey] + pointSize.value / 2

		window.onmousemove = movePointer
		window.onmouseup = () => {
			isPress.value = false
		}
	}

	// 移动进度指示点
	function movePointer (event) {
		if (!isPress.value) return
		const currentPointX = event[pageKey] - startOffset.value + startSize.value

		if (currentPointX <= 0) {
			setTargetPosition(0)
			return
		} else if (currentPointX >= totalSize.value) {
			setTargetPosition(totalSize.value)
			return
		}

		setTargetPosition(currentPointX)
	}

	function setTargetPosition (x: number) {
		currentPosition.value = x
		// TODO left width
		$processPointer.style.left = x - pointSize.value / 2 + 'px'
		$processPlayed.style.width = x + 'px'
	}

	return {
		startOffset,
		startSize,
		isPress,
		currentPosition,
		totalSize,
		pointSize,
		changeSize
	}
}
