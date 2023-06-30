function isElement (ele: any) {
	return ele instanceof HTMLElement
}

export function getElement (ele: string | HTMLElement): HTMLElement {
	if (typeof ele === 'string') {
		ele = document.querySelector(ele)
	}
	return <HTMLElement>ele
}

interface DirectionKey {
	startDistanceKey: string // 元素端点与父元素断电的距离
	sizeKey: string // 宽度或高度的key
	scrollKey: string // 滚动条滚动距离
	offsetKey: string // 鼠标相对事件元素偏移量
	clientKey: string // 鼠标距离可视区域的距离
	movementKey: string // 鼠标相对上次触发事件的偏移量
}
const directionKeys = {
	X: {
		startDistanceKey: 'offsetLeft',
		sizeKey: 'offsetWidth',
		scrollKey: 'scrollX',
		offsetKey: 'offsetX',
		clientKey: 'clientX',
		movementKey: 'movementX'
	},
	Y: {
		startDistanceKey: 'offsetTop',
		sizeKey: 'offsetHeight',
		scrollKey: 'scrollY',
		offsetKey: 'offsetY',
		clientKey: 'clientY',
		movementKey: 'movementY'
	}
}

export function getDirectionKey (direction: 'X' | 'Y'): DirectionKey {
	return directionKeys[direction]
}
