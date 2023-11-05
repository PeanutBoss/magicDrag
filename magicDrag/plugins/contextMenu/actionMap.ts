import {showOrHideContourPoint, updatePointPosition} from '../../common/magicDrag'
import { useMagicDrag } from '../../index'
import ContextMenu, {menuState} from '../contextMenu/index'
import {getTargetZIndex, TargetStatus} from "../../style/className";
import {addClassName, removeClassName, setStyle} from "../../utils/tools";

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
	customData?: Record<any, any>
	actionCallback (event): void
  getMenuContextParameter? (...rest: any[]): any
	// 最好显式的返回一个布尔值
	dragCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState): void
	}
	resizeCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState): void
	}
	mousedownCallbacks?: {
		beforeCallback? (targetState): boolean
		afterCallback? (targetState, state: any): void
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
		actionCallback (stateManager) {
			const { stateParameter, elementParameter, globalDataParameter: { initialTarget } } = stateManager.currentState
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
		actionCallback (stateManager) {
			const {
				stateParameter: { targetState, pointState },
				globalDataParameter: { initialTarget },
				elementParameter: { pointElements, privateTarget }
			} = stateManager.currentState
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
		actionCallback (stateManager) {
			const {
				stateParameter: { targetState, pointState },
				globalDataParameter: { initialTarget },
				elementParameter: { pointElements, privateTarget },
				optionParameter: { pointSize }
			} = stateManager.currentState
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
		actionCallback(stateManager) {
			const {
				globalDataParameter: { initialTarget, plugins },
				elementParameter: { privateTarget },
				optionParameter: { containerSelector }
			} = stateManager.currentState
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
			// TODO 复制目标元素后，需要将target设置为新复制的元素
			// useMagicDrag(`.${newClassName}`, { containerSelector }, [...plugins, new ContextMenu(actionList, options, stateManager)])
		}
	},
	delete: {
		name: 'delete',
		actionName: '删除',
		actionDom: null,
		actionCallback(stateManager) {
			const {
				elementParameter: { privateTarget, pointElements },
				globalDataParameter: { initialTarget }
			} = stateManager.currentState
			if (initialTarget.isLock) return

			showOrHideContourPoint(pointElements, false)
			privateTarget.remove()
		}
	},
	rotate: {
		name: 'rotate',
		actionName: '旋转',
		actionDom: null,
		actionCallback(stateManager) {
			const { elementParameter: { privateTarget, pointElements }, globalDataParameter: { initialTarget, downPointPosition } } = stateManager.currentState
			const rotate = 45
			initialTarget.rotate = 45
			privateTarget.style.transform = `rotate(${rotate}deg)`

			updatePostRotateOutlinePoint( { initialTarget, downPointPosition }, { pointElements }, { rotate, updateStyle: true })
		}
	},
	uppermost: {
		name: 'uppermost',
		actionName: '置顶',
		actionDom: null,
		customData: { index: 0 },
		actionCallback(stateManager) {
			const { elementParameter: { privateTarget }, globalDataParameter: { initialTarget } } = stateManager.currentState
			setStyle(privateTarget, 'zIndex', getTargetZIndex(TargetStatus.Uppermost, privateTarget) + ++this.customData.index)
			initialTarget.zIndex = TargetStatus.Uppermost + this.customData.index
		},
		mousedownCallbacks: {}
	},
	lowest: {
		name: 'lowest',
		actionName: '置底',
		actionDom: null,
		customData: { index: 0 },
		actionCallback(stateManager) {
			const { elementParameter: { privateTarget }, globalDataParameter: { initialTarget } } = stateManager.currentState
			setStyle(privateTarget, 'zIndex', getTargetZIndex(TargetStatus.Lowest, privateTarget) - ++this.customData.index)
			initialTarget.zIndex = TargetStatus.Lowest - this.customData.index
		},
		mousedownCallbacks: {
			afterCallback(targetState, stateManager) {
				const { elementParameter: { privateTarget } } = stateManager.currentState
				// 获取没有锁定的元素
				const notLockTargetList = stateManager.notLockState
				// 设置为正常状态
				for (const notLockTarget of notLockTargetList) {
					setStyle(notLockTarget.target, 'zIndex', notLockTarget.zIndex || getTargetZIndex(TargetStatus.Normal, notLockTarget.target))
				}
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

export function executeActionCallbacks (actionData, stateManager, type: 'beforeCallback' | 'afterCallback') {
	const targetState = stateManager.currentState.globalDataParameter.initialTarget
	let isContinue = true
	try {
		for (let i = 0; i < actionData.length; i++) {
			const data = actionData[i]
			// 获取回调执行结果，如果没有返回值则默认为true
			isContinue = data?.actions?.[type]?.(targetState, stateManager) ?? true
			// 如果某个回调返回false，则终止执行其他回调
			if (isContinue === false) break
		}
	} catch (e) {
		console.log(e, '----错误---')
		return false
	}
	return isContinue
}

export function updatePostRotateOutlinePoint ({ initialTarget, downPointPosition }, { pointElements }, { rotate, updateStyle = false }) {
	// 元素是以自身中心点为参考点旋转的，因此轮廓点也是以这个中心点旋转，获取以中心点坐标为参考点的所有点的相对坐标
	const relativePoint = getRelativeToTheCenterPoint(initialTarget, downPointPosition)
	// 旋转的角度，以弧度为单位
	const angleInRadians = (rotate * Math.PI) / 180
	for (const direction in relativePoint) {
		relativePoint[direction] = rotatePoint(relativePoint[direction], angleInRadians, initialTarget)
		updateStyle && setStyle(pointElements[direction], { left: relativePoint[direction][0], top: relativePoint[direction][1] })
	}
	return relativePoint
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
	const relativePoint = {}
	for (const direction in position) {
		relativePoint[direction] = relativeCenterPosition[direction](position['lt'], { width, height })
	}
	return relativePoint
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
