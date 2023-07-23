export interface Plugin {
	name: string
	init (domInfo, payload): void
  unbind (target: HTMLElement): void
}

export function executePluginInit (plugins: Plugin[], domInfo, payload) {
	plugins.forEach(plugin => {
		plugin.init(domInfo, payload)
	})
}

// TODO 防止手动篡改element
