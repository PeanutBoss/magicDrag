import {updatePointPosition, showOrHideContourPoint, setPosition} from '../../utils/magicDrag.ts'
import useMagicDrag from '../../useMagicDrag.ts'
import ContextMenu, { menuState } from '../contextMenu/index.ts'
import { getCurrentParameter } from '../../utils/parameter.ts'
import {getTargetZIndex, TargetStatus} from "../../style/className.ts";
import {setStyle, addClassName, removeClassName} from "../../utils/tools.ts";

function getScaleSize (originSize, ratio) {
	return {
		x: originSize.width * ratio,
		y: originSize.height * ratio
	}
}

function lockActionCallback (target, isLock: boolean, lockTargetClassName) {
		if (isLock) {
      addClassName(target, lockTargetClassName)
			// target.className += lockTargetClassName
      setStyle(target, 'zIndex', getTargetZIndex(TargetStatus.Locked, target))
		} else {
			// target.className = target.className.replace(lockTargetClassName, '')
      removeClassName(target, lockTargetClassName)
      setStyle(target, 'zIndex', getTargetZIndex(TargetStatus.Checked, target))
		}
}

export interface ActionDescribe {
	name: string
	actionDom: HTMLElement | null
	actionName: string
	actionCallback (event): void
  getMenuContextParameter? (...rest: any[]): any
	// 最好显式的返回一个布尔值
	dragCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState): boolean
	}
	resizeCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState): boolean
	}
	mousedownCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState): boolean
	}
	[key: string]: any
}
export interface ActionMap {
	[key: string]: ActionDescribe
}
export const actionMap: ActionMap = {
	lock: {
		name: 'lock',
		actionName: '锁定',
		actionDom: null,
		actionCallback () {
			const { stateParameter, elementParameter, globalDataParameter: { initialTarget } } = getCurrentParameter()
      const { options: { lockTargetClassName } } = this.getMenuContextParameter()
			stateParameter.targetState.isLock = !initialTarget.isLock
			initialTarget.isLock = !initialTarget.isLock
			lockActionCallback(elementParameter.privateTarget, initialTarget.isLock, lockTargetClassName)
			showOrHideContourPoint(elementParameter.pointElements, false)
		},
		dragCallbacks: {
			beforeCallback(targetState) {
				return !targetState.isLock
			},
			afterCallback(targetState): boolean {
				return !targetState.isLock
			}
		},
		resizeCallbacks: {
			beforeCallback(targetState) {
				return !targetState.isLock
			},
			afterCallback(targetState) {
				return !targetState.isLock
			}
		},
		mousedownCallbacks: {
			beforeCallback(targetState) {
				return !targetState.isLock
			}
		}
	},
	blowUp: {
		name: 'blowUp',
		actionName: '放大',
		actionDom: null,
		actionCallback() {
			const {
				stateParameter: { targetState, pointState },
				globalDataParameter: { initialTarget },
				elementParameter: { pointElements, privateTarget }
			} = getCurrentParameter()
			if (initialTarget.isLock) return

			const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

			targetState.width += scaleSize.x
			targetState.height += scaleSize.y
			updatePointPosition(
				privateTarget,
				{ direction: 'rb', movementX: { value: scaleSize.x }, movementY: { value: scaleSize.y } },
				{ initialTarget, pointElements, pointSize: 10, pointState },
				{ excludeCurPoint: false }
			)
			initialTarget.width += scaleSize.x
			initialTarget.height += scaleSize.y
			privateTarget.style.width = initialTarget.width + 'px'
			privateTarget.style.height = initialTarget.height + 'px'
		}
	},
	reduce: {
		name: 'reduce',
		actionName: '缩小',
		actionDom: null,
		actionCallback() {
			const {
				stateParameter: { targetState, pointState },
				globalDataParameter: { initialTarget },
				elementParameter: { pointElements, privateTarget },
				optionParameter: { pointSize }
			} = getCurrentParameter()
			if (initialTarget.isLock) return

			const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

			targetState.width -= scaleSize.x
			targetState.height -= scaleSize.y
			updatePointPosition(
				privateTarget,
				{ direction: 'rb', movementX: { value: -scaleSize.x }, movementY: { value: -scaleSize.y } },
				{ initialTarget, pointElements, pointSize, pointState },
				{ excludeCurPoint: false }
			)
			initialTarget.width -= scaleSize.x
			initialTarget.height -= scaleSize.y
			privateTarget.style.width = initialTarget.width + 'px'
			privateTarget.style.height = initialTarget.height + 'px'
		}
	},
	copy: {
		name: 'copy',
		actionName: '复制',
		actionDom: null,
		actionCallback() {
			const {
				globalDataParameter: { initialTarget },
				elementParameter: { privateTarget }
			} = getCurrentParameter()
			if (initialTarget.isLock) return

			const { actionList, options } = this.getMenuContextParameter()
			const parent = privateTarget.parentNode
			const copyTarget = privateTarget.cloneNode() as HTMLElement
			const newClassName = menuState.classCopyPrefix + menuState.copyIndex++
			copyTarget.className = newClassName
			copyTarget.style.width = privateTarget.offsetWidth + 'px'
			copyTarget.style.height = privateTarget.offsetHeight + 'px'
			copyTarget.style.left = initialTarget.left + options.offsetX + 'px'
			copyTarget.style.top = initialTarget.top + options.offsetY + 'px'
			parent.appendChild(copyTarget)
			useMagicDrag(`.${newClassName}`, { containerSelector: '.wrap' }, [new ContextMenu(actionList, options)])
		}
	},
	delete: {
		name: 'delete',
		actionName: '删除',
		actionDom: null,
		actionCallback() {
			const {
				elementParameter: { privateTarget, pointElements },
				globalDataParameter: { initialTarget }
			} = getCurrentParameter()
			if (initialTarget.isLock) return

			showOrHideContourPoint(pointElements, false)
			privateTarget.remove()
		}
	},
	rotate: {
		name: 'rotate',
		actionName: '旋转',
		actionDom: null,
		actionCallback(event) {
			const { elementParameter: { privateTarget, pointElements }, globalDataParameter: { initialTarget, downPointPosition } } = getCurrentParameter()
			const rotate = 90
			privateTarget.style.transform = `rotate(${rotate}deg)`

			const newPosition = getRelativeToTheCenterPoint(initialTarget, downPointPosition)

			// 旋转的角度，以弧度为单位
			const angleInRadians = (rotate * Math.PI) / 180
			for (const direction in newPosition) {
				newPosition[direction] = rotatePoint(newPosition[direction], angleInRadians, initialTarget)
				setStyle(pointElements[direction], { left: newPosition[direction][0], top: newPosition[direction][1] })
			}
		}
	}
}
export function getActionCallbacks (type: 'dragCallbacks' | 'resizeCallbacks' | 'mousedownCallbacks') {
	const actions = []
	for (const [_, describe]  of Object.entries(actionMap)) {
		actions.push({
			name: describe.name,
			actions: describe[type]
		})
	}
	return actions
}

export function executeActionCallbacks (actionData, targetState, type: 'beforeCallback' | 'afterCallback') {
	let isContinue = true
	try {
		for (let i = 0; i < actionData.length; i++) {
			const data = actionData[i]
			// 获取回调执行结果，如果没有返回值则默认为true
			isContinue = data?.actions?.[type]?.(targetState) ?? true
			// 如果某个回调返回false，则终止执行其他回调
			if (isContinue === false) break
		}
	} catch (e) {
		console.log(e, '----错误---')
		return false
	}
	return isContinue
}


function rotatePoint(point, angle, { width, height, left, top }) {
	const centerX = width / 2 + left
	const centerY = height / 2 + top
	const x = point[0] - centerX;
	const y = point[1] - centerY;
	const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
	const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
	return [rotatedX + centerX, rotatedY + centerY];
}
function getRelativeToTheCenterPoint ({ width, height, left, top }, position) {
	const newPosition = {}
	for (const direction in position) {
		newPosition[direction] = relativeCenterPosition[direction](position['lt'], { width, height })
	}
	return newPosition
}

const relativeCenterPosition = {
	lt ([x, y], { width, height }) {
		return [x, y]
	},
	rt ([x, y], { width, height }) {
		return [x + width, y]
	},
	lb ([x, y], { width, height }) {
		return [x, y + height]
	},
	rb ([x, y], { width, height }) {
		return [x + width, y + height]
	},
	l ([x, y], { width, height }) {
		return [x, y + height / 2]
	},
	t ([x, y], { width, height }) {
		return [x + width / 2, y]
	},
	r ([x, y], { width, height }) {
		return [x + width, y + height / 2]
	},
	b ([x, y], { width, height }) {
		return [x + width / 2, y + height]
	}
}
