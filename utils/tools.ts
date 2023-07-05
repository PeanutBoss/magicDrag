export function throttle (fn: any, delay: number) {
	let flag = true
	return () => {
		if ( !flag ) return
		flag = false
		setTimeout(() => {
			fn()
			flag = true // 核心
		}, delay)
	}
}

export function getElement (ele: string | HTMLElement): HTMLElement {
	if (typeof ele === 'string') {
		return document.querySelector(ele)
	}
	return ele
}
