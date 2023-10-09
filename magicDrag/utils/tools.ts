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

		if (typeof curVal === 'object' && !(curVal instanceof HTMLElement) && !Array.isArray(curVal)) {
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

export function baseWarnTips (condition, msg) {
	if (condition) {
		console.warn(msg)
	}
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


// check that the type of options passed in is correct
// 检查传入的选项类型是否正确
export function checkParameterType (defaultOptions, options = {}) {
  for (const key in defaultOptions) {
    const value = options[key]
    if (isNullOrUndefined(value)) continue
    const originType = typeof defaultOptions[key]
    const paramsType = typeof value
    baseErrorTips(
      originType !== paramsType,
      `The type of options.${key} should be ${originType}, But the ${paramsType} type is passed in.`
    )
  }
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
