import { ElementParameter, StateParameter, GlobalDataParameter, OptionParameter } from '../utils/parameter.ts'

export interface Plugin {
	name: string
	init (
		elementParameter: ElementParameter,
		stateParameter: StateParameter,
		globalDataParameter: GlobalDataParameter,
		options: OptionParameter
	): void
  unbind (
		elementParameter: ElementParameter,
		stateParameter: StateParameter,
		globalDataParameter: GlobalDataParameter,
		options: OptionParameter
	): void
}

export function executePluginInit (plugins: Plugin[], elementParameter, stateParameter, globalDataParameter, options) {
	plugins.forEach(plugin => {
		plugin.init(elementParameter, stateParameter, globalDataParameter, options)
	})
}

export function executePluginUnbind (plugins: Plugin[], elementParameter, stateParameter, globalDataParameter, options) {
	plugins.forEach(plugin => {
		plugin.unbind(elementParameter, stateParameter, globalDataParameter, options)
	})
}

// TODO 防止手动篡改element
