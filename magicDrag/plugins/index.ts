import { ElementParameter, StateParameter, GlobalDataParameter, OptionParameter } from '../utils/parameter.ts'
import {baseErrorTips, isNullOrUndefined} from "../utils/tools.ts";

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

export function duplicateRemovalPlugin (plugins: Plugin[]) {
	const pluginNameList = new Set()
	return plugins.filter(plugin => {

    baseErrorTips(isNullOrUndefined(plugin.name), 'please check if your plugin contains the name attribute')

    const hasPlugin = !pluginNameList.has(plugin.name)
		pluginNameList.add(plugin.name)
		return hasPlugin
	})
}

// TODO 防止手动篡改element
