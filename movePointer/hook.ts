import {nextTick, ref, computed, readonly, reactive, watch} from 'vue'
import type { Ref } from 'vue'
import { getElement, getDirectionKey } from './tool.ts'

interface MovePointerParams {
	process: string | HTMLElement
	processPlayed: string | HTMLElement
	processPointer: string | HTMLElement
	direction: 'ltr' | 'rtl' | 'ttb' | 'btt'
}

type PressState = {
  pointPress: boolean
  playedPress: boolean
  processPress: boolean
}

type ReadonlyRef<T> = Readonly<Ref<T>>
interface MoveDistance {
	startOffset: ReadonlyRef<number> // 按下鼠标时鼠标的相对文档最左/顶端的距离
	startSize: ReadonlyRef<number> // 按下鼠标前的位置与进度条最左/顶端的距离（按下鼠标时$processPlayed的宽/高度）
	currentPosition: Ref<number> // pointer相对于左/顶端点的位置（进度）
	totalSize: ReadonlyRef<number> // 进度条总宽度/高度
	pointSize: ReadonlyRef<number> // 指示点的尺寸
	changeSize: Readonly<Ref<number>> // 进度变化量
  readonly pressState: PressState // 进度条点击状态
}

export default function useMovePointer ({ process, processPlayed, processPointer, direction }: MovePointerParams):MoveDistance {
	let $process, $processPlayed, $processPointer

	// MARK 使用时如果传入dom元素，就有可能是在onMounted钩子里使用的hook，那么再在onMounted中做的初始化操作就不会执行
	nextTick(() => {
		$process = getElement(process)
		$processPlayed = getElement(processPlayed)
		$processPointer = getElement(processPointer)
		totalSize.value = $process[sizeKey]
    initElement()
	}).finally()
	const { startDistanceKey, sizeKey, offsetKey, pageKey, stylePosition, styleSize } = getDirectionKey(direction)

	const startOffset = ref(0)
	const startSize = ref(0)
	const currentPosition = ref(0)
	const totalSize = ref(0)
	const pointSize = ref(0)
	const changeSize = computed(() => currentPosition.value - startSize.value)
  const pressState = reactive<PressState>({
    playedPress: false,
    pointPress: false,
    processPress: false
  })

  function initElement () {
    $process.addEventListener('mousedown', downProcess)
    $process.addEventListener('mouseup', upProcess)
    $processPointer.addEventListener('mousedown', downPointer)
		$process.onmouseenter = getPointerOffset;
		['rtl', 'btt'].includes(direction) && ($process.style.rotate = '180deg')
    $processPlayed.style[styleSize] = 0
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
    if (event.target === $processPlayed) {
      pressState.playedPress = true
    } else {
      pressState.processPress = true
    }
		startSize.value = $processPlayed[sizeKey]
		setTargetPosition(event[offsetKey])
	}

  function upProcess () {
    pressState.playedPress = false
    pressState.processPress = false
    pressState.pointPress = false
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

    pressState.pointPress = true
		// 鼠标按下时修改相对位置
		startOffset.value = event[pageKey]

		window.onmousemove = movePointer
		window.onmouseup = () => {
      pressState.pointPress = false
		}
	}

	// 移动进度指示点
	function movePointer (event) {
		if (!pressState.pointPress) return
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

  watch(currentPosition, (position) => {
    if (position < 0 || position > totalSize.value) return
    currentPosition.value = position
    $processPlayed.style[styleSize] = position + 'px'
    $processPointer.style[stylePosition] = position - 4 + 'px'
  })

	return {
    startOffset: readonly(startOffset),
		startSize: readonly(totalSize),
		currentPosition,
		totalSize: readonly(totalSize),
		pointSize: readonly(pointSize),
		changeSize: readonly(changeSize),
    pressState: readonly(pressState)
	}
}
