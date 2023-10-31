import PluginManager from '../functions/pluginManager'
import RefLine from '../plugins/refLine'
import Keymap from '../plugins/keymap'
import { MagicDragOptions } from '../common/magicDragAssist'

export const pluginManager = new PluginManager()

export function usePlugin(options: MagicDragOptions) {
	options.skill.refLine && enableRefLine(options)
	options.skill.keymap && enableShortcut()
	pluginManager.installPlugin()
}

function enableRefLine(options: MagicDragOptions) {
	const refLine = new RefLine({ gap: 10 }, options)
	pluginManager.registerPlugin(refLine.name, refLine)
}

function enableShortcut() {
	const keymap = new Keymap()
	pluginManager.registerPlugin(keymap.name, keymap)
}

