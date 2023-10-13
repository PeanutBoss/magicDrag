import PluginManager from '../functions/pluginManager'
import RefLine from '../plugins/refLine'
import Keymap from '../plugins/keymap'
import { MagicDragOptions } from '../common/magicDragAssist'

export const pluginManager = new PluginManager()

export function usePlugin(skill: MagicDragOptions['skill']) {
	skill.refLine && enableRefLine()
	skill.keymap && enableShortcut()
	pluginManager.installPlugin()
}

function enableRefLine() {
	const refLine = new RefLine({ gap: 10 })
	pluginManager.registerPlugin(refLine.name, refLine)
}

function enableShortcut() {
	const keymap = new Keymap()
	pluginManager.registerPlugin(keymap.name, keymap)
}

