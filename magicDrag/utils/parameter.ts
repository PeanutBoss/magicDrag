// 以目标元素的 dataset.index 作为key保存所有参数信息
import {MagicDragOptions} from '../useMagicDrag.ts'
import { Ref, watch } from 'vue'
import {isNullOrUndefined} from "./tools.ts";

let currentTarget = null

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
export interface OptionParameter {
  target: HTMLElement, container: HTMLElement, pointElements: any, allTarget: any
}

export type Parameter = {
	elementParameter: ElementParameter
	stateParameter: StateParameter
	globalDataParameter: GlobalDataParameter
	optionParameter: MagicDragOptions
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
	return getParameter(target.dataset.index)
}

export function getNotLockParameter (excludeIndex?):HTMLElement[] {
  const notLockParameterList = []
  for (const [index, parameter] of Object.entries(wholeParameter)) {
    if (!isNullOrUndefined(excludeIndex) && excludeIndex == index) continue
    if (!parameter.globalDataParameter.initialTarget.isLock) {
      notLockParameterList.push(parameter)
    }
  }
  return notLockParameterList.map((m: Parameter) => m.elementParameter.privateTarget)
}
