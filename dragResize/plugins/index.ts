export interface Plugin {
	name: string
	init (target: HTMLElement, initialTarget): void
}

const ContainerClassName = 'drag_resize-menu-container'
const ItemClassName = 'drag_resize-menu-item'

export function executePluginInit (plugins: Plugin[], target: HTMLElement, initialTarget) {
	plugins.forEach(plugin => {
		plugin.init(target, initialTarget)
	})
}

let menuBox

function getMenuBox () {
	if (!menuBox) {
		menuBox = document.createElement('div')
		menuBox.className = ContainerClassName
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

export function insertAction (actionName: string | HTMLElement, actionCallback) {
	const menuBox = getMenuBox()
	console.log(menuBox)
	let actionDom
	if (typeof actionName === 'string') {
		actionDom = document.createElement('div')
		actionDom.className = ItemClassName
		actionDom.textContent = actionName
	}
	actionDom.onclick = actionCallback
	menuBox.appendChild(actionDom)
}

function bindHidden (event) {
	if (event.target !== getMenuBox()) {
		showMenu(false)
	}
}
