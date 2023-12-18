/* Global variable correlation - 全局变量相关 */
import { Ref } from '@vue/reactivity'
import { Direction } from './magicDrag'
import { ClassName } from '../style/className'
import { DomElementRecords } from '../manager/stateManager'

export interface MagicDragOptions {
	containerSelector: string
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
	pointSize?: number
	gap?: number
	adsorb?: boolean
	showShadow?: boolean
	showRefLine?: boolean
	showDistance?: boolean
	grid?: boolean
	// ratio?: [number, number]
  initialInfo?: {
    width?: number
    height?: number
    left?: number
    top?: number
  }
	containerRange?: {
		left?: number
		top?: number
		width?: number
		height?: number
		bottom?: number
		right?: number
	}
	skill?: {
		resize?: boolean
		drag?: boolean
		refLine?: boolean
		shortcut?: boolean
    regionalSelection?: boolean
		limitDragDirection?: 'X' | 'Y' | null
	}
	callbacks?: {
		dragCallback?: (dragAction: () => void, movement: { movementX: number, movementY: number }) => void
		resizeCallback?: (resizeAction: () => void, direction: Direction, movement: { movementX: number, movementY: number } ) => void
	}
	customClass?: {
		customPointClass?: string
	},
  customStyle?: {
    tipStyle?: Partial<CSSStyleDeclaration>
    pointStyle?: Partial<CSSStyleDeclaration>
    refLineStyle?: Partial<CSSStyleDeclaration>
		selectedStyle?: Partial<CSSStyleDeclaration>
  }
}

const _defaultOptions: MagicDragOptions = {
	containerSelector: 'body',
	minWidth: 10, // minimum width - 最小宽度
	minHeight: 10, // minimum height - 最小高度
	maxWidth: 999999, // 最大宽度
	maxHeight: 999999, // 最大高度
	gap: 3, // 吸附的最小间距
	showRefLine: true, // 显示参考线
	adsorb: true, // 开启吸附功能
	showDistance: true, // 显示组件间距
	// pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
	// ratio: [3, 4],
	grid: true,
	initialInfo: {
		width: 200,
		height: 200,
		left: 0,
		top: 0
	},
	skill: {
		resize: true, // whether the size adjustment is supported - 是否支持大小调整
		drag: true, // whether to support dragging - 是否支持拖动
		refLine: true, // whether to support refLine - 是否支持参考线
		shortcut: true, // whether to support shortcut - 是否支持快捷键
		regionalSelection: false, // whether multiple region selection is supported - 是否支持区域多选
		limitDragDirection: null // restricted direction of movement - 限制移动方向
	},
	customClass: {
		customPointClass: ClassName.OutlinePoint, // 自定义轮廓点的类名
	},
	callbacks: {},
	customStyle: {
		pointStyle: {
			position: 'absolute',
			display: 'none',
			boxSizing: 'border-box',
			width: '10px',
			height: '10px',
			zIndex: '88888',
			border: '1px solid #999',
			borderRadius: '50%'
		},
		tipStyle: {
			position: 'absolute',
			display: 'none',
			boxSizing: 'border-box',
			width: '34px',
			height: '18px',
			zIndex: '99999',
			padding: '2px 5px',
			fontSize: '12px',
			background: '#0086FF',
			borderRadius: '7px',
			color: '#fff',
			textAlign: 'center',
			lineHeight: '14px'
		},
		refLineStyle: {
			position: 'absolute',
			display: 'none',
			opacity: '0.7',
			background: '#4DAEFF',
			zIndex: '88888'
		},
		selectedStyle: {
			outline: '1px solid black'
		}
	}
}
export function defaultOptions() {
	return _defaultOptions
}

export interface MagicDragState {
	targetLeft: Ref<number>
	targetTop: Ref<number>
	targetWidth: Ref<number>
	targetHeight: Ref<number>
	targetIsLock: Ref<boolean>
	pointLeft: Ref<number>
	pointTop: Ref<number>
	pointMovementX: Ref<number>
	pointMovementY: Ref<number>
	targetIsPress: Ref<boolean>
	pointIsPress: Ref<boolean>
	direction: Ref<string | null>
	getStateList: () => DomElementRecords['state'][]
	getTargetState: () => DomElementRecords['state']
  unMount(): void
}

const todoUnmountCbs = []
export function addGlobalUnmountCb(cb) {
	todoUnmountCbs.push(cb)
}
export function unMountGlobalCb() {
	todoUnmountCbs.forEach(cb => cb())
	todoUnmountCbs.length = 0
}
