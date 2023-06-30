/*
* MouseDownEvent
* layerX/Y: 鼠标相对于目标元素的X/Y轴偏移量，例如点击目标元素最左侧为0，点击最右侧为目标元素宽度
* clientX/Y: 鼠标点击位置相对于浏览器窗口可视区域的X/Y轴的距离
* offsetX/Y: 鼠标点击位置相对于事件目标元素的左/上边界的距离
* pageX/Y: 鼠标点击位置相对于文档页面左/上边界的距离
* screenX/Y: 鼠标点击位置相对于屏幕左/上边界的距离
* x/y: 鼠标点击位置相对于触发事件的元素左/上边界的距离
* */

/*
* TODO 初始化目标元素
*  初始化方向的key
* */

import { ref, onMounted, createApp } from 'vue/dist/vue.esm-bundler.js'

const component = {
	template: `
		<div class="process" @mousedown="downProcess" ref="process">
			<div class="process-played" :style="{ width: playProcess }"></div>
			<div class="process-pointer" @mousedown="downPointer"></div>
		</div>
	`,
	setup() {
		const playProcess: any = ref(0) // 播放进度
		let skewProcess = 0 // 进度条左边的相对位置
		let startOffset = 0 // 按下鼠标时鼠标的相对位置
		let skewDistance = 0 // 按下鼠标时与（移动后）当前位置的距离
		let isPress = false // 是否按下
		let $process, $processPlayed, $processPointer
		onMounted(() => {
			$process = document.querySelector('.process')
			$processPlayed = document.querySelector('.process-played')
			$processPointer = document.querySelector('.process-pointer')
			// 获取进度条最左端与窗口的距离
			skewProcess = $process.offsetLeft
			// 滚动条滚动时重新计算（进度条最左端与窗口的距离可能会发生变化）
			window.addEventListener('scroll', () => {
				skewProcess = $process.offsetLeft - window.scrollX
			})
		})

		function getPercent (val) {
			return (val * 100).toFixed(1) + '%'
		}
		// 根据进度条已播放区域的距离计算当前播放进度（时间）
		function getCurrentPositionTime (offset) {
			const percent = offset / $process.offsetWidth
		}
		// 点击进度条调整进度
		function downProcess (event) {
			// 因为process和processPlayed元素的左侧在同一个位置，所以他们的offsetX相同，无需特殊处理processPlayed
			if (event.target.className === 'process-pointer') return
			setTargetPosition(event.offsetX)
		}
		// 点击进度指示点
		function downPointer (event) {
			// 计算点击的位置与 processPlayed 右端的距离
			const targetPosition = event.offsetX + $processPlayed.offsetWidth - 4
			setTargetPosition(targetPosition)

			isPress = true
			// 鼠标按下时修改相对位置
			startOffset = event.clientX
			skewDistance = 0

			window.onmousemove = movePointer
			window.onmouseup = () => {
				isPress = false
			}
		}
		// 移动进度指示点
		function movePointer (event) {
			if (!isPress) return
			skewDistance += event.movementX
			// 鼠标点击的位置 - 进度条左端距浏览器左边窗口的距离 + 鼠标当前与按下时的偏移量（正负）
			const currentPointX = startOffset - skewProcess + skewDistance
			setTargetPosition(currentPointX)
		}

		function setTargetPosition (x: number) {
			$processPointer.style.left = x - 4 + 'px'
			$processPlayed.style.width = x + 'px'
		}

		return {
			downPointer,
			downProcess,
			playProcess
		}
	}
}

const app = createApp(component)

app.mount('#app')
