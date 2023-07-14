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

export function mergeObject (target, source) {
	const mergedObject = {}
	for (const key in { ...target, ...source }) {
		const curVal = source[key]
		const originVal = target[key]
		isNullOrUndefined(curVal) ?
			mergedObject[key] = originVal :
			mergedObject[key] = curVal

		if (typeof curVal === 'object') {
			mergedObject[key] = mergeObject(originVal, curVal)
		}
	}
	return mergedObject
}

export function isNullOrUndefined (val: unknown): boolean {
	return val === null || val === undefined
}
