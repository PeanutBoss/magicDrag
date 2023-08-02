// 以目标元素的 dataIndex 作为key保存所有参数信息

export type Parameter = {
	elementParameter: {}
	stateParameter: {}
	globalDataParameter: {}
	optionParameter: {}
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
