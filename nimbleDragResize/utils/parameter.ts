// 以目标元素的 dataIndex 作为key保存所有参数信息
import { DragResizeOptions } from '../useDragResize.ts'
import { Ref, watch } from 'vue'

let currentTarget = null

export interface ElementParameter {
  target: Ref<HTMLElement>
	container: Ref<HTMLElement>
	privateTarget: HTMLElement | null
	privateContainer: HTMLElement | null
	pointElements: any
	allTarget: any
}
export interface StateParameter {
  pointState,
	targetState,
}
export interface GlobalDataParameter {
  initialTarget, containerInfo, downPointPosition
}
export interface OptionParameter {
  target: HTMLElement, container: HTMLElement, pointElements: any, allTarget: any
}

export type Parameter = {
	elementParameter: ElementParameter
	stateParameter: StateParameter
	globalDataParameter: GlobalDataParameter
	optionParameter: DragResizeOptions
}

type WholeParameter = {
	[key: number]: Parameter
}

const wholeParameter: WholeParameter = {}

export function getParameter (index: number): Parameter {
	return wholeParameter[index]
}

export function setParameter (index: number, value: Parameter) {
	wholeParameter[index] = value
}

export function setCurrentTarget (target: HTMLElement) {
  currentTarget = target
}

export function getCurrentTarget () {
  return currentTarget
}

export function getCurrentParameter (): Parameter {
	const target = getCurrentTarget()
	return getParameter(target.dataIndex)
}

window.whole = wholeParameter
