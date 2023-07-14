export function baseErrorTips (condition, msg) {
	if (condition) {
		throw Error(msg)
	}
}

function createTargetPosition ({ left, top, width, height }, pointSize: number) {
	const halfPointSize = pointSize / 2
	return {
		lt: [0 - halfPointSize, 0 - halfPointSize, 'nw-resize'],
		lb: [0 - halfPointSize, height - halfPointSize, 'ne-resize'],
		rt: [width - halfPointSize, 0 - halfPointSize, 'ne-resize'],
		rb: [width - halfPointSize, height - halfPointSize, 'nw-resize'],
		t: [width / 2 - halfPointSize, 0 - halfPointSize, 'n-resize'],
		b: [width / 2 - halfPointSize, height - halfPointSize, 'n-resize'],
		l: [0 - halfPointSize, height / 2 - halfPointSize, 'e-resize'],
		r: [width - halfPointSize, height / 2 - halfPointSize, 'e-resize']
	}
}
