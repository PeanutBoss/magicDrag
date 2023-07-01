function isElement (ele: any) {
	return ele instanceof HTMLElement
}

export function getElement (ele: string | HTMLElement): HTMLElement {
	if (typeof ele === 'string') {
    return document.querySelector(ele)
	}
	return ele
}

interface DirectionKey {
	startDistanceKey: string // 元素端点与父元素断电的距离
	sizeKey: string // 宽度或高度的key
	scrollKey: string // 滚动条滚动距离
	offsetKey: string // 鼠标相对事件元素偏移量
	clientKey: string // 鼠标距离可视区域的距离
	movementKey: string // 鼠标相对上次触发事件的偏移量
	pageKey: string // 鼠标相对文档最左/顶端的距离
	stylePosition: string // 元素定位
	styleSize: string // 元素尺寸
}
const directionKeys = {
	X: {
		startDistanceKey: 'offsetLeft',
		sizeKey: 'offsetWidth',
		scrollKey: 'scrollX',
		offsetKey: 'offsetX',
		clientKey: 'clientX',
		movementKey: 'movementX',
		pageKey: 'pageX',
		stylePosition: 'left',
		styleSize: 'width'
	},
	Y: {
		startDistanceKey: 'offsetTop',
		sizeKey: 'offsetHeight',
		scrollKey: 'scrollY',
		offsetKey: 'offsetY',
		clientKey: 'clientY',
		movementKey: 'movementY',
		pageKey: 'pageY',
		stylePosition: 'top',
		styleSize: 'height'
	}
}

export function getDirectionKey (direction: 'ltr' | 'rtl' | 'ttb' | 'btt'): DirectionKey {
	if (['ltr', 'rtl'].includes(direction)) {
		return directionKeys['X']
	} else return directionKeys['Y']
}
