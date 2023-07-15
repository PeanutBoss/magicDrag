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

function setStyle() {

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
