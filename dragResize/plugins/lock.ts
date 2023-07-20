import { showMenu } from "./index.ts";

export default {
	name: 'Lock',
	init (target: HTMLElement) {
		target.addEventListener('contextmenu', (event) => {
			event.preventDefault()
			showMenu(true, { left: event.pageX, top: event.pageY })
		})
	}
}

