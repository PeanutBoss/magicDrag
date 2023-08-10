import { Ref } from 'vue'
import { updatePointPosition } from '../../utils/dragResize.ts'
import useDragResize from '../../useDragResize.ts'
import ContextMenu, { menuState } from '../contextMenu/index.ts'
import { getCurrentParameter } from '../../utils/parameter.ts'

const lockMap: Map<HTMLElement, boolean> = new Map()
const lockActionMap: Map<HTMLElement, HTMLElement[]> = new Map()

const LockItemClassName = ' drag_resize-menu-item-lock' // 锁定选项的类名
const LockTargetClassName = ' drag_resize-target-lock' // 锁定目标元素的类名

function getScaleSize (originSize, ratio) {
	return {
		x: originSize.width * ratio,
		y: originSize.height * ratio
	}
}

function lockCallback (target, actionDoms: HTMLElement[], isLock: boolean) {
	for (const [index, action] of Object.entries(actionDoms)) {
		if (index === '0') continue
		if (isLock) {
			action.className += LockItemClassName
			target.className += LockTargetClassName
		} else {
			action.className = action.className.replace(LockItemClassName, '')
			target.className = target.className.replace(LockTargetClassName, '')
		}
	}
}

interface ActionState {
	state: {
		targetState: any
		initialTarget: any
		pointState: any
	},
	domInfo: {
		target: Ref<HTMLElement>
		pointElements: { [key: string]: HTMLElement }
		container: Ref<HTMLElement>
	}
}
export interface ActionDescribe {
	name: string
	actionDom: HTMLElement | null
	actionName: string
	actionCallback (event): void
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
			const { stateParameter, elementParameter } = getCurrentParameter()
			stateParameter.targetState.isLock = !stateParameter.targetState.isLock
			lockCallback(elementParameter.privateTarget, menuState.actionElementList, stateParameter.targetState.isLock)
		},
		dragCallbacks: {
			beforeCallback(targetState) {
				return !targetState.isLock
			},
			afterCallback(targetState): boolean {
				return true
			}
		},
		resizeCallbacks: {},
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
			if (targetState.isLock) return

			const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

			targetState.width += scaleSize.x
			targetState.height += scaleSize.y
			privateTarget.style.width = targetState.width + 'px'
			privateTarget.style.height = targetState.height + 'px'
			updatePointPosition(
				privateTarget,
				{ direction: 'rb', movementX: { value: scaleSize.x }, movementY: { value: scaleSize.y } },
				{ initialTarget, pointElements, pointSize: 10, pointState },
				false
			)
			initialTarget.width += scaleSize.x
			initialTarget.height += scaleSize.y
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
				elementParameter: { pointElements, privateTarget }
			} = getCurrentParameter()
			if (targetState.isLock) return

			const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

			targetState.width -= scaleSize.x
			targetState.height -= scaleSize.y
			privateTarget.style.width = targetState.width + 'px'
			privateTarget.style.height = targetState.height + 'px'
			updatePointPosition(
				privateTarget,
				{ direction: 'rb', movementX: { value: -scaleSize.x }, movementY: { value: -scaleSize.y } },
				{ initialTarget, pointElements, pointSize: 10, pointState },
				false
			)
			initialTarget.width -= scaleSize.x
			initialTarget.height -= scaleSize.y
		}
	},
	copy: {
		name: 'copy',
		actionName: '复制',
		actionDom: null,
		actionCallback() {
			const {
				stateParameter: { targetState },
				globalDataParameter: { initialTarget },
				elementParameter: { privateTarget }
			} = getCurrentParameter()
			if (targetState.isLock) return

			const parent = privateTarget.parentNode
			const copyTarget = privateTarget.cloneNode() as HTMLElement
			// console.log(copyTarget)
			const newClassName = menuState.classCopyPrefix + menuState.copyIndex++
			copyTarget.className = newClassName
			copyTarget.style.width = privateTarget.offsetWidth + 'px'
			copyTarget.style.height = privateTarget.offsetHeight + 'px'
			copyTarget.style.left = initialTarget.left + 20 + 'px'
			copyTarget.style.top = initialTarget.top + 20 + 'px'
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
				stateParameter: { targetState },
				elementParameter: { privateTarget }
			} = getCurrentParameter()
			if (targetState.isLock) return

			privateTarget.remove()
		}
	}
}
