export interface Plugin {
	name: string
	init (target: HTMLElement, initialTarget): void
}

export function executePluginInit (plugins: Plugin[], target: HTMLElement, initialTarget) {
	plugins.forEach(plugin => {
		plugin.init(target, initialTarget)
	})
}

let menuBox

function getMenuBox () {
	if (!menuBox) {
		menuBox = document.createElement('div')
		menuBox.className = 'drag_resize-menu-container'
		document.body.append(menuBox)
	}
	return menuBox
}

export function destroyMenu () {
	menuBox.remove()
	menuBox = null
}

export function showMenu (isShow, position = {}) {
	event.preventDefault()

	const { left = 0, top = 0 } = position
	const menuBox = getMenuBox()

	menuBox.style.left = left + 'px'
	menuBox.style.top = top + 'px'
	menuBox && (menuBox.style.display = isShow ? 'block' : 'none')

	if (isShow) {
		window.addEventListener('mousedown', bindHidden)
	}
}

function bindHidden (event) {
	if (event.target !== getMenuBox()) {
		showMenu(false)
	}
}
