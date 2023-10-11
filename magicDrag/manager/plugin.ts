import PluginManager from '../functions/pluginManager'
import RefLine from '../plugins/refLine'
import Keymap from '../plugins/keymap'

export const pluginManager = new PluginManager()
const refLine = new RefLine({ gap: 10 })
const keymap = new Keymap()

export function usePlugin() {
	pluginManager.registerPlugin(refLine.name, refLine)
	pluginManager.registerPlugin(keymap.name, keymap)

	pluginManager.installPlugin()
}

