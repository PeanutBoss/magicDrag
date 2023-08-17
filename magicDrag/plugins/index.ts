import {baseErrorTips, isNullOrUndefined} from "../utils/tools.ts";
import { Parameter } from '../utils/parameter.ts'

export interface Plugin {
	name: string
	init (parameter: Parameter): void
	drag?(parameter: Parameter, cb?): void
	resize?(parameter: Parameter, cb?): void
  unbind (parameter: Parameter): void
}

export function executePluginInit (plugins: Plugin[], elementParameter, stateParameter, globalDataParameter, options) {
	plugins.forEach(plugin => {
		plugin.init({ elementParameter, stateParameter, globalDataParameter, optionParameter: options })
	})
}

export function executePluginDrag (plugins: Plugin[], parameter, cb?) {
	plugins.forEach(plugin => {
		plugin?.drag?.(parameter, cb)
	})
}

export function executePluginResize (plugins: Plugin[], parameter, cb?) {
	plugins.forEach(plugin => {
		plugin?.resize?.(parameter, cb)
	})
}

export function executePluginUnbind (plugins: Plugin[], elementParameter, stateParameter, globalDataParameter, options) {
	plugins.forEach(plugin => {
		plugin.unbind({ elementParameter, stateParameter, globalDataParameter, optionParameter: options })
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
