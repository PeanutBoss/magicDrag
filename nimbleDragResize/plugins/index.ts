export interface Plugin {
	name: string
	init (elementParameter, stateParameter, globalDataParameter, options): void
  unbind (target: HTMLElement): void
}

export function executePluginInit (plugins: Plugin[], elementParameter, stateParameter, globalDataParameter, options) {
	plugins.forEach(plugin => {
		plugin.init(elementParameter, stateParameter, globalDataParameter, options)
	})
}

// TODO 防止手动篡改element
