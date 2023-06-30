import { onMounted } from 'vue'
import { getElement, getDirectionKey } from './tool.ts'

interface MovePointerParams {
	process: string | HTMLElement
	processPlayed: string | HTMLElement
	processPointer: string | HTMLElement
	direction: 'X' | 'Y'
}

export function useMovePointer ({ process, processPlayed, processPointer, direction }: MovePointerParams) {
	let $process, $processPlayed, $processPointer

	onMounted(() => {
		$process = getElement(process)
		$processPlayed = getElement(processPlayed)
		$processPointer = getElement(processPointer)

		skewProcess = $process[startDistanceKey]
		window.addEventListener('scroll', () => {
			skewProcess = $process[startDistanceKey] - window[scrollKey]
		})
    addEvent()
	})
	const { startDistanceKey, sizeKey, movementKey, offsetKey, scrollKey, clientKey } = getDirectionKey(direction)

	let skewProcess = 0 // 进度条左边的相对位置
	let startOffset = 0 // 按下鼠标时鼠标的相对位置
	let skewDistance = 0 // 按下鼠标时与（移动后）当前位置的距离
	let isPress = false // 是否按下

  function addEvent () {
    $process.addEventListener('mousedown', downProcess)
    $processPointer.addEventListener('mousedown', downPointer)
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
		const targetPosition = event[offsetKey] + $processPlayed[sizeKey] - 4
		setTargetPosition(targetPosition)

		isPress = true
		// 鼠标按下时修改相对位置
		startOffset = event[clientKey]
		skewDistance = 0

		window.onmousemove = movePointer
		window.onmouseup = () => {
			isPress = false
		}
	}

	// 移动进度指示点
	function movePointer (event) {
		if (!isPress) return
		skewDistance += event[movementKey]
		// 鼠标点击的位置 - 进度条左端距浏览器左边窗口的距离 + 鼠标当前与按下时的偏移量（正负）
		const currentPointX = startOffset - skewProcess + skewDistance
		setTargetPosition(currentPointX)
	}

	function setTargetPosition (x: number) {
		// TODO left width
		$processPointer.style.left = x - 4 + 'px'
		$processPlayed.style.width = x + 'px'
	}
}
