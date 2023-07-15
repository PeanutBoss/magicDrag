import { conditionExecute } from "./tools.ts";

export type Direction = 'lt' | 'lb' | 'rt' | 'rb' | 'l' | 'r' | 't' | 'b'
interface DirectionDescription {
	hasL: boolean
	hasR: boolean
	hasT: boolean
	hasB: boolean
}

// 每个元素代表一个轮廓点的方向
export const All_DIRECTION: Direction[] = ['lt', 'lb', 'rt', 'rb', 'l', 'r', 't', 'b']

// 根据轮廓点的方向获取这个点的
export function getDirectionDescription (direction: Direction):DirectionDescription {
	const hasL = direction.indexOf('l') > -1
	const hasR = direction.indexOf('r') > -1
	const hasB = direction.indexOf('b') > -1
	const hasT = direction.indexOf('t') > -1
	return {
		hasL,
		hasR,
		hasT,
		hasB
	}
}

// 创建移动各个轮廓点更新目标元素坐标与尺寸信息的策略
export function createCoordinateStrategies () {
	const strategies = {}
	All_DIRECTION.forEach(direction => {
		const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
		strategies[direction] = ({ left, top, height, width, offsetX, offsetY }) => {
			return {
				left: conditionExecute(hasL, left + offsetX + 'px', left + 'px'),
				top: conditionExecute(hasT, top + offsetY + 'px', top + 'px'),
				width: conditionExecute(hasL, width - offsetX + 'px', conditionExecute(hasR, width + offsetX + 'px', width + 'px')),
				height: conditionExecute(hasT, height - offsetY + 'px', conditionExecute(hasB, height + offsetY + 'px', height + 'px'))
			}
		}
	})
	return strategies
}

// 创建调整目标大小时限制最小尺寸的策略
export function createResizeLimitStrategies (initialTarget, minWidth, minHeight) {
	const strategies = {}
	const leftTask = (movementX, moveMaxDistanceX) => {
		if (movementX.value > moveMaxDistanceX) {
			movementX.value = moveMaxDistanceX
		}
	}
	const topTask = (movementY, moveMaxDistanceY) => {
		if (movementY.value > moveMaxDistanceY) {
			movementY.value = moveMaxDistanceY
		}
	}
	const bottomTask = (movementY, moveMaxDistanceY) => {
		if (-movementY.value > moveMaxDistanceY) {
			movementY.value = -moveMaxDistanceY
		}
	}
	const rightTask = (movementX, moveMaxDistanceX) => {
		if (-movementX.value > moveMaxDistanceX) {
			movementX.value = -moveMaxDistanceX
		}
	}

	All_DIRECTION.forEach(direction => {
		strategies[direction] = ({ movementX, movementY }) => {
			const { width, height } = initialTarget
			const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
			// the maximum distance that can be moved
			const moveMaxDistanceX = width - minWidth
			const moveMaxDistanceY = height - minHeight

			hasL && leftTask(movementX, moveMaxDistanceX)
			hasT && topTask(movementY, moveMaxDistanceY)
			hasR && rightTask(movementX, moveMaxDistanceX)
			hasB && bottomTask(movementY, moveMaxDistanceY)
		}
	})
	return strategies
}

// 创建更新目标尺寸/坐标后获取最新的轮廓点坐标策略
export function createParamStrategies () {
	const strategies = {}
	All_DIRECTION.forEach(direction => {
		const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
		strategies[direction] = ({ left, top, width, height, movementX, movementY }) => {
			return {
				left: conditionExecute(hasL, left + movementX.value, left),
				top: conditionExecute(hasT, top + movementY.value, top),
				width: conditionExecute(hasL, width - movementX.value, conditionExecute(hasR, width + movementX.value, width)),
				height: conditionExecute(hasT, height - movementY.value, conditionExecute(hasB, height + movementY.value, height))
			}
		}
	})
	return strategies
}


type SetStyle = {
	(target: HTMLElement, styleData: { [key: string]: string }): void
	(target: HTMLElement, styleKey: string, styleValue: string): void
}
const setStyle: SetStyle = (target: HTMLElement, styleKey: string | object, styleValue?: string) => {
	if (typeof styleKey === 'object') {
		const keys = Object.keys(styleKey)
		keys.forEach(key => {
			target.style[key] = styleKey[key]
		})
		return
	}
	target.style[styleKey] = styleValue
}

export interface PointPosition {
	[key: Direction]: [number, number, string?, 'X' | 'Y'?]
}
// set element position
export function setPosition (point: HTMLElement, pointPosition: PointPosition, direction: Direction) {
	setStyle(point, 'left', pointPosition[direction][0] + 'px')
	setStyle(point, 'top', pointPosition[direction][1] + 'px')
}

export function createParentPosition ({ left, top, width, height }, pointSize: number): PointPosition {
	const halfPointSize = pointSize / 2
	return {
		lt: [left - halfPointSize, top - halfPointSize, 'nw-resize'],
		lb: [left - halfPointSize, top + height - halfPointSize, 'ne-resize'],
		rt: [left + width - halfPointSize, top - halfPointSize, 'ne-resize'],
		rb: [left + width - halfPointSize, top + height - halfPointSize, 'nw-resize'],
		t: [left + width / 2 - halfPointSize, top - halfPointSize, 'n-resize', 'X'],
		b: [left + width / 2 - halfPointSize, top + height - halfPointSize, 'n-resize', 'X'],
		l: [left - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y'],
		r: [left + width - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y']
	}
}
