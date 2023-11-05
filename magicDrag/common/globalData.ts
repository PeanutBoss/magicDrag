/* Global variable correlation - 全局变量相关 */
import { Direction } from './magicDrag'
import { ClassName } from '../style/className'
import { Ref, reactive, ref } from '@vue/reactivity'
import { deepClone } from '../utils/tools'
import { DomElementState } from "../functions/stateManager";

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
	ratio?: [number, number]
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
    multipleChoice?: boolean
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
  }
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
	getStateList: () => DomElementState[]
	getTargetState: () => DomElementState['state']
}
class GlobalData {
	private allTarget = []
	private allContainer = []
	private storingData: any = {}
	private _defaultState: any = {}
	private _defaultOptions: MagicDragOptions = {
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
		ratio: [3, 4],
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
      multipleChoice: false, // whether multiple election is supported - 是否支持多选
      regionalSelection: true, // whether multiple region selection is supported - 是否支持区域多选
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
			}
		}
	}
	constructor() {
		this.createStoringData()
		this.createDefaultState()
	}
	allElement() {
		return { allTarget: this.allTarget, allContainer: this.allContainer }
	}
	createStoringData() {
		// the target element being manipulated
		// 操作的目标元素和容器元素
		this.storingData.$target = ref(null)
		this.storingData.$container = ref(null)
		// coordinates and dimensions of the target element - 目标元素的坐标和尺寸
		this.storingData.initialTarget = null
		// save contour point - 保存轮廓点
		this.storingData.pointElements = null
		// 容器元素的坐标信息
		this.storingData.containerInfo = null
		// It is used to record the position information of each contour point when the target element is pressed
		// 用于记录目标元素被按下时各个轮廓点的位置信息
		this.storingData.downPointPosition = null
	}
	createDefaultState() {
		this._defaultState.targetState = reactive({
			left: 0,
			top: 0,
			height: 0,
			width: 0,
			isPress: false
		})
		this._defaultState.pointState = reactive({
			left: 0,
			top: 0,
			direction: null,
			isPress: false,
			movementX: 0,
			movementY: 0
		})
	}
	storingDataContainer() {
		return {
			$target: this.storingData.$target,
			$container: this.storingData.$container,
			initialTarget: this.storingData.initialTarget,
			pointElements: this.storingData.pointElements,
			containerInfo: this.storingData.containerInfo,
			downPointPosition: this.storingData.downPointPosition
		}
	}
	get defaultState() {
		return { ...this._defaultState }
	}
	get defaultOptions() {
		return deepClone(this._defaultOptions)
	}
}

export default new GlobalData()
