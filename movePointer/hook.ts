import { nextTick, onMounted, Ref, ref, computed } from 'vue'
import { getElement, getDirectionKey } from './tool.ts'

interface MovePointerParams {
	process: string | HTMLElement
	processPlayed: string | HTMLElement
	processPointer: string | HTMLElement
	direction: 'ltr' | 'rtl' | 'ttb' | 'btt'
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
    initElement()
	})
	const { startDistanceKey, sizeKey, offsetKey, pageKey, stylePosition, styleSize } = getDirectionKey(direction)

	const startOffset = ref(0)
	const startSize = ref(0)
	const isPress = ref(false)
	const currentPosition = ref(0)
	const totalSize = ref(0)
	const pointSize = ref(0)
	const changeSize = computed(() => currentPosition.value - startSize.value)

  function initElement () {
    $process.addEventListener('mousedown', downProcess)
    $processPointer.addEventListener('mousedown', downPointer)
		$process.onmouseenter = getPointerOffset;
		['rtl', 'btt'].includes(direction) && ($process.style.rotate = '180deg')
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
		// 事件目标是$processPointer，它的offsetLeft要比$processPlayed左移了 pointSize.value/2 个单位
		startSize.value = event.target[startDistanceKey] + pointSize.value / 2
		setTargetPosition(targetPosition)

		isPress.value = true
		// 鼠标按下时修改相对位置
		startOffset.value = event[pageKey]

		window.onmousemove = movePointer
		window.onmouseup = () => {
			isPress.value = false
		}
	}

	// 移动进度指示点
	function movePointer (event) {
		if (!isPress.value) return
		// 方向正常
		// const currentPointOffset = event[pageKey] - startOffset.value + startSize.value
		// 方向反转
		// const currentPointOffset = totalSize.value - event[pageKey] + $process[startDistanceKey]
		const currentPointOffset = getPointSize(event)

		if (currentPointOffset <= 0) {
			setTargetPosition(0)
			return
		} else if (currentPointOffset >= totalSize.value) {
			setTargetPosition(totalSize.value)
			return
		}

		setTargetPosition(currentPointOffset)
	}

	function setTargetPosition (x: number) {
		currentPosition.value = x
		$processPointer.style[stylePosition] = x - pointSize.value / 2 + 'px'
		$processPlayed.style[styleSize] = x + 'px'
	}

	// 获取点的坐标
	function getPointSize (event) {
		if (['ltr', 'ttb'].includes(direction)) {
			return event[pageKey] - startOffset.value + startSize.value
		} else {
			return totalSize.value - event[pageKey] + $process[startDistanceKey]
		}
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
