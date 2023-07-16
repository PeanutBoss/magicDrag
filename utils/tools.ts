export const EXECUTE_NEXT_TASK = 'EXECUTE_NEXT_TASK'

export function throttle (fn: any, delay: number, options: any = {}) {
  let { immediate = false } = options
	let flag = true
	return (...rest) => {
		if (!flag) return
    if (immediate) {
      fn(...rest)
      immediate = false
    }
		flag = false
		setTimeout(() => {
			fn(...rest)
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
	if (!source) return { ...target }
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

export function conditionExecute (condition, task1, task2) {
	return condition ? task1 : task2
}

export function removeElements (elements: HTMLElement[]) {
	elements.forEach(ele => {
		ele.remove()
	})
}

export function baseErrorTips (condition, msg) {
	if (condition) {
		throw Error(msg)
	}
}

export function insertAfter () {
  Reflect.set(Function.prototype, 'after', function (fn) {
    const self = this
    return function (...rest) {
      const ret = self.apply(this, rest)
      if (ret === EXECUTE_NEXT_TASK) {
        return fn.apply(this, rest)
      }
      return ret
    }
  })
}
