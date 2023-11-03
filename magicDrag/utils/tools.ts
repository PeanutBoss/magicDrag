export function throttle (fn: any, delay: number, options: any = {}) {
  let { leading = false } = options
	let flag = true
	return (...rest) => {
		if (!flag) return
    if (leading) {
      fn(...rest)
			leading = false
    }
		flag = false
		setTimeout(() => {
			fn(...rest)
			flag = true // 核心
		}, delay)
	}
}

export function notSelectorAndHTML(value) {
	return typeof value !== 'string' && !(value instanceof HTMLElement)
}

export function getElement (ele: string | HTMLElement): HTMLElement {
	if (typeof ele === 'string') {
		return document.querySelector(ele)
	}
	return ele
}

// 合并对象，优先使用source的字段
export function mergeObject (target, source, ...rest) {
	if (!source) return { ...target }
	const mergedObject = {}
	for (const key in { ...target, ...source }) {
		const curVal = source[key]
		const originVal = target[key]
		isNullOrUndefined(curVal)
			? mergedObject[key] = originVal
			: mergedObject[key] = curVal

		if (typeof curVal === 'object' && !(curVal instanceof HTMLElement) && !Array.isArray(curVal)) {
			mergedObject[key] = mergeObject(originVal, curVal)
		}
	}
	return mergedObject
}

export function isNullOrUndefined (val: unknown): boolean {
	return val === null || val === undefined
}

export function conditionExecute (condition, task1, task2?) {
	if (isNullOrUndefined(task2)) return condition && task1
	return condition ? task1 : task2
}

export function removeElements (elements: HTMLElement[]) {
	elements.forEach(ele => {
		ele.remove()
	})
}

export function baseErrorTips (condition, msg) {
	if (condition) throw Error(msg)
}

export function baseWarnTips (condition, msg) {
	if (condition) console.warn(msg)
}

type SetStyle = {
  (target: HTMLElement, styleData: { [key: string]: string }): void
  (target: HTMLElement, styleKey: string, styleValue: string | number): void
}
export const setStyle: SetStyle = (target: HTMLElement, styleKey: string | object, styleValue?: string) => {
  if (typeof styleKey === 'object') {
    const keys = Object.keys(styleKey)
    keys.forEach(key => {
      target.style[key] = styleKey[key]
    })
    return
  }
  target.style[styleKey] = styleValue
}

// 将defaultAction的控制权交给callback
export function transferControl (defaultAction, callback?, ...rest) {
  callback ? callback(defaultAction, ...rest) : defaultAction()
}

export function getObjectIntValue (object): any {
	const newObject = {}
	for (const key in object) {
		newObject[key] = parseInt(object[key])
	}
	return newObject
}

export function appendChild (parent: HTMLElement, ...child: HTMLElement[]) {
	parent.append(...child)
}

export function addClassName (element: HTMLElement, className: string) {
  const isIncludeClassName = element.className.indexOf(` ${className} `) > -1
  if (!isIncludeClassName) {
    element.className += ` ${className} `
  }
}

export function removeClassName (element: HTMLElement, className: string) {
  element.className = element.className.replaceAll(className, '')
}

export function watcher() {
	let callbacks = []
	return {
		executeCB(newV, oldV) {
			callbacks.forEach(cb => cb(newV, oldV))
		},
		insertCB(callback) {
			callbacks.push(callback)
		},
		destroy() {
			callbacks = null
		}
	}
}

export function deepFlatObj(object) {
	const result = {}
	for (const key in object) {
		result[key] = object[key]
		if (typeof object[key] === 'object' && !isHTMLEl(object[key])) {
			result[key] = deepFlatObj(object[key])
		}
	}
	return result
}

function isHTMLEl(data) {
	return data instanceof HTMLElement
}

export const createElement = document.createElement

export function deepClone(obj: object, clones = new WeakMap()) {
	if (typeof obj !== 'object') return obj

	if (clones.has(obj)) {
		return clones.get(obj)
	}

	const result = {}

	for (const key in obj) {
		if (typeof obj === 'object' && !isNullOrUndefined(obj[key])) {
			result[key] = deepClone(obj[key])
		} else if (Array.isArray(obj[key])) {
			result[key] = [...obj[key]]
		} else if (isNullOrUndefined(obj[key])) {
			result[key] = null
		} else if (obj[key] instanceof Date) {
			result[key] = new Date(obj[key])
		} else if (obj[key] instanceof RegExp) {
			result[key] = new RegExp(obj[key])
		} else if (typeof obj[key] === 'symbol') {
			result[key] = Symbol(obj[key].description)
		} else {
			result[key] = obj[key]
		}
	}

	clones.set(obj, result)

	return result
}

// 将number类型的尺寸信息改为以 px 为单位的字符串尺寸信息
export function numberToStringSize(size: Record<string, number>): Record<string, string> {
  const result = {}
  for (const key in size) {
    result[key] = size[key] + 'px'
  }
  return result
}
