const paramStrategies = {
	lt ({ left, top, width, height, movementX, movementY }) {
	return {
		left: left + movementX.value,
		top: top + movementY.value,
		width: width - movementX.value,
		height: height - movementY.value
	}
},
	lb ({ left, top, width, height, movementX, movementY }) {
	return {
		left: left + movementX.value,
		top,
		width: width - movementX.value,
		height: height + movementY.value
	}
},
	rt ({ left, top, width, height, movementX, movementY }) {
	return {
		left,
		top: top + movementY.value,
		width: width + movementX.value,
		height: height - movementY.value
	}
},
	rb ({ left, top, width, height, movementX, movementY }) {
	return {
		left,
		top,
		width: width + movementX.value,
		height: height + movementY.value
	}
},
	t ({ left, top, width, height, movementX, movementY }) {
	return {
		left,
		top: top + movementY.value,
		width,
		height: height - movementY.value
	}
},
	b ({ left, top, width, height, movementX, movementY }) {
	return {
		left,
		top,
		width,
		height: height + movementY.value
	}
},
	l ({ left, top, width, height, movementX, movementY }) {
	return {
		left: left + movementX.value,
		top,
		width: width - movementX.value,
		height
	}
},
	r ({ left, top, width, height, movementX, movementY }) {
	return {
		left,
		top,
		width: width + movementX.value,
		height
	}
}
}

function setStyle(a, b) {

}

const pointStrategies: any = {
	lt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			left: left + offsetX + 'px',
			top: top + offsetY + 'px',
			width: width - offsetX + 'px',
			height: height - offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	lb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			left: left + offsetX + 'px',
			width: width - offsetX + 'px',
			height: height + offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	rt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			top: top + offsetY + 'px',
			width: width + offsetX + 'px',
			height: height - offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	rb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			width: width + offsetX + 'px',
			height: height + offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	t (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			top: top + offsetY + 'px',
			height: height - offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	b (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			height: height + offsetY + 'px'
		}
		setStyle(target, styleData)
	},
	l (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			left: left + offsetX + 'px',
			width: width - offsetX + 'px'
		}
		setStyle(target, styleData)
	},
	r (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
		const styleData = {
			width: width + offsetX + 'px'
		}
		setStyle(target, styleData)
	}
}

let initialTarget = {}, minWidth, minHeight
const resizeLimitStrategies: any = {
	lt ({ movementX, movementY }) {
		const { width, height } = initialTarget
		// the maximum distance that can be moved
		const moveMaxDistanceX = width - minWidth
		const moveMaxDistanceY = height - minHeight
		if (movementX.value > moveMaxDistanceX) {
			movementX.value = moveMaxDistanceX
		}

		if (movementY.value > moveMaxDistanceY) {
			movementY.value = moveMaxDistanceY
		}
	},
	lb ({ movementX, movementY }) {
		const { width, height } = initialTarget
		const moveMaxDistanceX = width - minWidth
		const moveMaxDistanceY = height - minHeight
		if (movementX.value > moveMaxDistanceX) {
			movementX.value = moveMaxDistanceX
		}
		if (-movementY.value > moveMaxDistanceY) {
			movementY.value = -moveMaxDistanceY
		}
	},
	rt ({ movementX, movementY }) {
		const { width, height } = initialTarget
		const moveMaxDistanceX = width - minWidth
		const moveMaxDistanceY = height - minHeight
		if (-movementX.value > moveMaxDistanceX) {
			movementX.value = -moveMaxDistanceX
		}

		if (movementY.value > moveMaxDistanceY) {
			movementY.value = moveMaxDistanceY
		}
	},
	rb ({ movementX, movementY }) {
		const { width, height } = initialTarget
		const moveMaxDistanceX = width - minWidth
		const moveMaxDistanceY = height - minHeight
		if (-movementX.value > moveMaxDistanceX) {
			movementX.value = -moveMaxDistanceX
		}

		if (-movementY.value > moveMaxDistanceY) {
			movementY.value = -moveMaxDistanceY
		}
	},
	l ({ movementX }) {
		const { width, height } = initialTarget
		const moveMaxDistanceX = width - minWidth
		if (movementX.value > moveMaxDistanceX) {
			movementX.value = moveMaxDistanceX
		}
	},
	r ({ movementX }) {
		const { width, height } = initialTarget
		const moveMaxDistanceX = width - minWidth
		if (-movementX.value > moveMaxDistanceX) {
			movementX.value = -moveMaxDistanceX
		}
	},
	t ({ movementY }) {
		const { width, height } = initialTarget
		const moveMaxDistanceY = height - minHeight

		if (movementY.value > moveMaxDistanceY) {
			movementY.value = moveMaxDistanceY
		}
	},
	b ({ movementY }) {
		const { width, height } = initialTarget
		const moveMaxDistanceY = height - minHeight

		if (-movementY.value > moveMaxDistanceY) {
			movementY.value = -moveMaxDistanceY
		}
	}
}
