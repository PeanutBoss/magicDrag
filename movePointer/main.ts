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
import useMovePointer from './hook.ts'
import {onMounted} from "vue";

const component = {
	template: `
		<div style="text-align: center">
			状态：<template v-if="pressState.pointPress">按下指示点</template>
      <template v-if="pressState.processPress">按下进度条</template>
      <template v-if="pressState.playedPress">按下内容进度条</template><br>
			当前位置：<input type="text" v-model="currentPosition"><br>
			当前进度：{{ (currentPosition / totalSize * 100).toFixed(2) + '%' }}<br>
			本次进度变化：{{ formatPercent(changeSize, totalSize) }}<br>
		</div>

		<div class="process">
			<div class="process-played"></div>
			<div class="process-pointer"></div>
		</div>

    <div class="process_v">
			<div class="process-played_v"></div>
			<div class="process-pointer_v"></div>
    </div>
	`,
	setup() {
		const {
			startOffset,
			startSize,
			pressState,
			totalSize,
			currentPosition,
			changeSize
		} = useMovePointer({
			process: '.process',
			processPointer: '.process-pointer',
			processPlayed: '.process-played',
			direction: 'rtl'
		})

		onMounted(() => {
			useMovePointer({
				process: '.process_v',
				processPointer: document.querySelector('.process-pointer_v') as HTMLDivElement,
				processPlayed: '.process-played_v',
				direction: 'ttb'
			})
		})

		function formatPercent (count, total) {
			return (count / total * 100).toFixed(2) + '%'
		}

		return {
			startOffset,
			startSize,
      pressState,
			totalSize,
			currentPosition,
			formatPercent,
			changeSize
		}
	}
}

const app = createApp(component)

app.mount('#app')
