import watcher from '../utils/watcher'

class StateManager {
	private elementStateMap
	private currentElement
	private currentData
	private targetState
	private pointState
	constructor() {
		this.elementStateMap = new WeakMap()
	}

	registerElement(element, data) {
		if (this.elementStateMap[element]) {
			console.warn('元素已经注册，将覆盖该元素的状态信息')
		}
		this.elementStateMap[element] = data
	}

	setCurrentElement(element) {
		if (!this.elementStateMap[element]) throw Error('元素未注册')
		this.currentElement = element
		this.currentData = this.elementStateMap[element]
	}

	getElementState(element) {
		return this.elementStateMap.get(element) || {}
	}

	updateElementState(element, newState) {
		this.elementStateMap.set(element, newState)
		// 触发事件，通知插件状态更新
		watcher.trigger('elementStateChanged', element)
	}
}
