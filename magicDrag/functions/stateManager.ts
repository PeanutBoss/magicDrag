import { Ref } from 'vue'
import { MagicDragOptions } from '../common/magicDragAssist'

type DomElementState = {
	element: HTMLElement
	state: State
}

type Flatten<T> = T extends object
	? T extends infer O
		? { [K in keyof O]: O[K] }
		: never
	: T

type DeepFlatten<T> = T extends object
	? T extends infer O
		? O extends object
			? { [K in keyof O]: DeepFlatten<O[K]> }
			: O
		: never
	: T

export function splitState(state: State) {
	return {
		target: state.elementParameter.target,
		container: state.elementParameter.container,
		privateTarget: state.elementParameter.privateTarget,
		privateContainer: state.elementParameter.privateContainer,
		pointElements: state.elementParameter.pointElements,
		allTarget: state.elementParameter.allTarget,
		allContainer: state.elementParameter.allContainer,
		pointState: state.stateParameter.pointState,
		targetState: state.stateParameter.targetState,
		initialTarget: state.globalDataParameter.initialTarget,
		containerInfo: state.globalDataParameter.containerInfo,
		downPointPosition: state.globalDataParameter.downPointPosition,
		drag: state.optionParameter.skill.drag,
		resize: state.optionParameter.skill.resize,
		limitDragDirection: state.optionParameter.skill.limitDragDirection,
		dragCallback: state.optionParameter.callbacks.dragCallback,
		resizeCallback: state.optionParameter.callbacks.resizeCallback,
		customPointClass: state.optionParameter.customClass.customPointClass,
		containerSelector: state.optionParameter.containerSelector,
		minWidth: state.optionParameter.minWidth,
		minHeight: state.optionParameter.minHeight,
		maxWidth: state.optionParameter.maxWidth,
		maxHeight: state.optionParameter.maxHeight,
		pointSize: state.optionParameter.pointSize
	}
}

export interface ElementParameter {
	target: Ref<HTMLElement>
	container: Ref<HTMLElement>
	privateTarget: HTMLElement | null
	privateContainer: HTMLElement | null
	pointElements: any
	allTarget: HTMLElement[]
	allContainer: HTMLElement[]
}
export interface StateParameter {
	pointState,
	targetState,
}
export interface GlobalDataParameter {
	initialTarget, containerInfo, downPointPosition
}

export type State = {
	elementParameter: ElementParameter
	stateParameter: StateParameter
	globalDataParameter: GlobalDataParameter
	optionParameter: MagicDragOptions
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

  get targetState() {
    return this.currentState.targetState
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

	get notLockState() {
		return this.elementStates.filter(item => !item.state.globalDataParameter.initialTarget.isLock)
			.filter(item => item.state.elementParameter.privateTarget !== this.currentElement)
			.map(m => ({ target: m.element, zIndex: m.state.globalDataParameter.initialTarget.zIndex }))
	}

	// 设置当前选中的 DOM 元素和状态
	setCurrentElement(element: HTMLElement | null) {
		this.selectedElement = element
		this.selectedState = this.getElementState(element!) // 获取选中元素的状态
    this.updatePublicTargetState() // 更新公共状态
		this.notifySubscribers(this.selectedElement, this.selectedState)
	}

  updatePublicTargetState() {
    StateManager.COORDINATE_KEY.forEach(key => {
      this.currentState.stateParameter.targetState[key] = this.currentState.globalDataParameter.initialTarget[key]
    })
  }

  updatePublicPointState() {
    StateManager.COORDINATE_KEY.forEach(key => {

    })
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

  get containerLeft() {
    return this.currentState?.globalDataParameter?.containerInfo?.offsetLeft || 0
  }
  get containerTop() {
    return this.currentState?.globalDataParameter?.containerInfo?.offsetTop || 0
  }

  static COORDINATE_KEY = ['left', 'top', 'width', 'height']
}

export default StateManager
