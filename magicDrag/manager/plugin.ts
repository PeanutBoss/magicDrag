import PluginManager from '../functions/pluginManager'
import { MagicDragOptions } from '../common/globalData'
import RefLine, { RefLineOptions } from '../plugins/refLine'
import Shortcut from '../plugins/shortcut'
import MultipleChoice from '../plugins/multipleChoice'
import RegionalSelection from '../plugins/regionalSelection'
import { getElement } from '../utils/tools'

export const pluginManager = new PluginManager()

export function usePlugin(options: MagicDragOptions) {
	options.skill.refLine && enableRefLine(tidyRefLineOptions(options))
	options.skill.shortcut && enableShortcut()
  options.skill.multipleChoice && enableMultipleChoice()
  options.skill.regionalSelection && enableRegionalSelection(getElement(options.containerSelector))
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
	const shortcut = new Shortcut()
	pluginManager.registerPlugin(shortcut.name, shortcut)
}

function enableMultipleChoice() {
  const multipleChoice = new MultipleChoice()
  pluginManager.registerPlugin(multipleChoice.name, multipleChoice)
}

function enableRegionalSelection(container: HTMLElement) {
  const regionalSelection = new RegionalSelection(container)
  pluginManager.registerPlugin(regionalSelection.name, regionalSelection)
}
