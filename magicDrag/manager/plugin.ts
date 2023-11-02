import PluginManager from '../functions/pluginManager'
import RefLine, { RefLineOptions } from '../plugins/refLine'
import Keymap from '../plugins/keymap'
import { MagicDragOptions } from '../common/globalData'

export const pluginManager = new PluginManager()

export function usePlugin(options: MagicDragOptions) {
	options.skill.refLine && enableRefLine(tidyRefLineOptions(options))
	options.skill.keymap && enableShortcut()
	pluginManager.installPlugin()
}

function tidyRefLineOptions(options: MagicDragOptions) {
	const result = {} as RefLineOptions
	result.customStyle = options.customStyle
	result.gap = options.gap
	result.adsorb = options.adsorb
	result.showRefLine = options.showRefLine
	result.showDistance = options.showDistance
	return result
}

function enableRefLine(options: RefLineOptions) {
	const refLine = new RefLine(options)
	pluginManager.registerPlugin(refLine.name, refLine)
}

function enableShortcut() {
	const keymap = new Keymap()
	pluginManager.registerPlugin(keymap.name, keymap)
}

