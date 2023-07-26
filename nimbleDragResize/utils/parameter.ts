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
