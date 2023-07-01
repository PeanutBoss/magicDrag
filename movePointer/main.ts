/*
* MouseDownEvent
* layerX/Y: 鼠标相对于目标元素的X/Y轴偏移量，例如点击目标元素最左侧为0，点击最右侧为目标元素宽度
* clientX/Y: 鼠标点击位置相对于浏览器窗口可视区域的X/Y轴的距离
* offsetX/Y: 鼠标点击位置相对于事件目标元素的左/上边界的距离
* pageX/Y: 鼠标点击位置相对于文档页面左/上边界的距离
* screenX/Y: 鼠标点击位置相对于屏幕左/上边界的距离
* x/y: 鼠标点击位置相对于触发事件的元素左/上边界的距离
* */

import { createApp } from 'vue/dist/vue.esm-bundler.js'
import { useMovePointer } from './hook.ts'

const component = {
	template: `
		<div style="text-align: center">
			状态：{{ isPress ? '可移动' : '不可移动' }}<br>
			当前位置：{{ currentPosition }}<br>
			当前进度：{{ (currentPosition / totalSize * 100).toFixed(2) + '%' }}<br>
			本次进度变化：{{ formatPercent(changeSize, totalSize) }}<br>
		</div>

		<div class="process">
			<div class="process-played"></div>
			<div class="process-pointer"></div>
		</div>
	`,
	setup() {
		const {
			startOffset,
			startSize,
			isPress,
			totalSize,
			pointerOffset,
			currentPosition,
			changeSize
		} = useMovePointer({
			process: '.process',
			processPointer: '.process-pointer',
			processPlayed: '.process-played',
			direction: 'X'
		})

		function formatPercent (count, total) {
			return (count / total * 100).toFixed(2) + '%'
		}

		return {
			startOffset,
			startSize,
			isPress,
			totalSize,
			pointerOffset,
			currentPosition,
			formatPercent,
			changeSize
		}
	}
}

const app = createApp(component)

app.mount('#app')
