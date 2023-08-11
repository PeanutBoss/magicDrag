import { updatePointPosition, showOrHideContourPoint } from '../../utils/dragResize.ts'
import useDragResize from '../../useDragResize.ts'
import ContextMenu, { menuState, classNames } from '../contextMenu/index.ts'
import { getCurrentParameter } from '../../utils/parameter.ts'

function getScaleSize (originSize, ratio) {
	return {
		x: originSize.width * ratio,
		y: originSize.height * ratio
	}
}

function lockActionCallback (target, isLock: boolean) {
		if (isLock) {
			target.className += classNames.LockTargetClassName
		} else {
			target.className = target.className.replace(classNames.LockTargetClassName, '')
		}
}

export interface ActionDescribe {
	name: string
	actionDom: HTMLElement | null
	actionName: string
	actionCallback (event): void
	getMenuContextOptions? (...rest: any[]): void
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
			stateParameter.targetState.isLock = !initialTarget.isLock
			initialTarget.isLock = !initialTarget.isLock
			lockActionCallback(elementParameter.privateTarget, initialTarget.isLock)
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
		getMenuContextOptions (options) {
			return options
		},
		actionCallback() {
			const {
				globalDataParameter: { initialTarget },
				elementParameter: { privateTarget }
			} = getCurrentParameter()
			if (initialTarget.isLock) return

			const { options: { offsetX, offsetY } } = this.getMenuContextOptions()

			const parent = privateTarget.parentNode
			const copyTarget = privateTarget.cloneNode() as HTMLElement
			const newClassName = menuState.classCopyPrefix + menuState.copyIndex++
			copyTarget.className = newClassName
			copyTarget.style.width = privateTarget.offsetWidth + 'px'
			copyTarget.style.height = privateTarget.offsetHeight + 'px'
			copyTarget.style.left = initialTarget.left + offsetX + 'px'
			copyTarget.style.top = initialTarget.top + offsetY + 'px'
			parent.appendChild(copyTarget)
			useDragResize(`.${newClassName}`, { containerSelector: '.wrap' }, [new ContextMenu()])
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

