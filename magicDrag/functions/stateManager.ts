type DomElementState = {
	element: HTMLElement
	state: any
}

type Callback = (element: HTMLElement, state: any) => void

class StateManager {
	private elementStates: DomElementState[] = []
	private selectedElement: HTMLElement | null = null
	private selectedState: any = null
	private subscriptions: Record<string, Callback[]> = {}

	/**
	 * 添加 DOM 元素的状态
	 * @param element 添加的DOM元素
	 * @param initialState DOM
	 * @param isSetSelected 是否设置为选中状态
	 */
	registerElementState(element: HTMLElement, initialState: any, isSetSelected = true) {
		this.elementStates.push({ element, state: initialState })
		isSetSelected && this.setCurrentElement(element)
	}

	// 获取 DOM 元素的状态
	getElementState(element: HTMLElement) {
		const elementState = this.elementStates.find((es) => es.element === element)
		if (!elementState) throw Error('元素未注册')
		return elementState ? elementState.state : null
	}

	// 更新 DOM 元素的状态
	updateElementState(element: HTMLElement, newState: any) {
		const elementState = this.elementStates.find((es) => es.element === element)
		if (elementState) {
			elementState.state = newState
			this.notifySubscribers(element, newState)
		}
	}

	// 获取当前选中的 DOM 元素
	get currentElement() {
		return this.selectedElement
	}

	// 获取当前选中的 DOM 元素的状态
	get currentState() {
		return this.selectedState
	}

	get size() {
		return this.elementStates.length
	}

	// 设置当前选中的 DOM 元素和状态
	setCurrentElement(element: HTMLElement | null) {
		this.selectedElement = element
		this.selectedState = this.getElementState(element!) // 获取选中元素的状态
		this.notifySubscribers(this.selectedElement, this.selectedState)
	}

	// 订阅状态变化
	subscribe(key: string, callback: Callback) {
		if (!this.subscriptions[key]) {
			this.subscriptions[key] = []
		}
		this.subscriptions[key].push(callback)
	}

	// 取消订阅状态变化
	unsubscribe(key: string, callback: Callback) {
		if (this.subscriptions[key]) {
			this.subscriptions[key] = this.subscriptions[key].filter((cb) => cb !== callback)
		}
	}

	// 通知订阅者状态变化
	private notifySubscribers(element: HTMLElement | null, state: any) {
		const callbacks = this.subscriptions['selection']
		if (callbacks) {
			callbacks.forEach((callback) => callback(element!, state))
		}
	}
}

export default StateManager
