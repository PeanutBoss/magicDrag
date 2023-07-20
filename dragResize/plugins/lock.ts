import { showMenu, insertAction } from "./index.ts";

export default {
	name: 'Lock',
	init (target: HTMLElement) {
		target.addEventListener('contextmenu', (event) => {
			event.preventDefault()
			insertAction('锁定', () => {
				console.log('锁定')
			})
			showMenu(true, { left: event.pageX, top: event.pageY })
		})
	}
}

