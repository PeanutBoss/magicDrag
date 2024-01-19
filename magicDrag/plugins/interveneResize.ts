import { Plugin } from '../manager'

class InterveneResize implements Plugin {
	name: string
	private multiple = 1
	constructor() {
		this.name = 'resize'
	}
	init() {}
	unbind() {}
	interveneDrag(movement) {
		this.resizeAfterMovement(movement)
	}
	resizeAfterMovement(movement: { x: number, y: number }) {
		movement.x *= this.multiple
		movement.y *= this.multiple
	}
}

export default InterveneResize
