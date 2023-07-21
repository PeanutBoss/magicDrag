export interface Plugin {
	name: string
	init (target: HTMLElement, targetState): void
  unbind (): void
}

export function executePluginInit (plugins: Plugin[], target: HTMLElement, targetState) {
	plugins.forEach(plugin => {
		plugin.init(target, targetState)
	})
}
