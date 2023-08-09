// 以目标元素的 dataIndex 作为key保存所有参数信息
import { DragResizeOptions } from '../useDragResize.ts'

interface ElementParameter {
  target: HTMLElement, container: HTMLElement, pointElements: any, allTarget: any
}
interface StateParameter {
  pointState, targetState
}
interface GlobalDataParameter {
  initialTarget, containerInfo, downPointPosition
}
interface OptionParameter {
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
