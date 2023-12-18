import PluginManager from '../manager/pluginManager'
import { MagicDragOptions } from '../common/globalData'
import RefLine, { RefLineOptions } from '../plugins/refLine'
import Shortcut from '../plugins/shortcut'
import RegionalSelection from '../plugins/regionalSelection'
import { stateManager } from './state'
import StateManager from './stateManager'

export const pluginManager = new PluginManager()

export function usePlugin(options: MagicDragOptions) {
	options.skill.regionalSelection && enableRegionalSelection(options.containerSelector, stateManager)
	options.skill.refLine && enableRefLine(tidyRefLineOptions(options), stateManager)
	options.skill.shortcut && enableShortcut()
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

function enableRefLine(options: RefLineOptions, stateManager: StateManager) {
	const refLine = new RefLine(options, stateManager)
	pluginManager.registerPlugin(refLine.name, refLine)
}

function enableShortcut() {
	const shortcut = new Shortcut()
	pluginManager.registerPlugin(shortcut.name, shortcut)
}

function enableRegionalSelection(container: string, stateManager: StateManager) {
  const regionalSelection = new RegionalSelection(container, stateManager)
  pluginManager.registerPlugin(regionalSelection.name, regionalSelection)
}
