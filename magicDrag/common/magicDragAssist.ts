/* Global variable correlation - 全局变量相关 */
import { Direction } from './magicDrag.ts'
import { ClassName } from '../style/className'
import { Ref, reactive, ref } from '@vue/reactivity'
import { deepClone } from '../utils/tools'

export interface MagicDragOptions {
	containerSelector: string
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
	pointSize?: number
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
		keymap?: boolean
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

// default configuration
// 默认配置
const _defaultOptions: MagicDragOptions = {
	containerSelector: 'body',
	minWidth: 10, // minimum width - 最小宽度
	minHeight: 10, // minimum height - 最小高度
	maxWidth: 999999, // 最大宽度
	maxHeight: 999999, // 最大高度
	pointSize: 10, // the size of the contour point - 轮廓点的大小
	// pageHasScrollBar: false, // whether the page has a scroll bar - 页面是否有滚动条
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
		keymap: false, // whether to support shortcut - 是否支持快捷键
		limitDragDirection: null // restricted direction of movement - 限制移动方向
	},
	customClass: {
		customPointClass: ClassName.OutlinePoint, // 自定义轮廓点的类名
	},
	callbacks: {},
  customStyle: {
    pointStyle: {
      zIndex: '88888',
      position: 'absolute',
      boxSizing: 'border-box',
      border: '1px solid #999',
      borderRadius: '50%',
      display: 'none'
    },
    tipStyle: {
      position: 'absolute',
      padding: '2px 5px',
      fontSize: '12px',
      background: '#0086FF',
      zIndex: '88888',
      borderRadius: '7px',
      // width: `${tipWidth}px`,
      // height: `${tipHeight}px`,
      color: '#fff',
      textAlign: 'center',
      lineHeight: '14px',
      display: 'none',
      boxSizing: 'border-box'
    },
    refLineStyle: {
      display: 'none',
      opacity: '0.7',
      position: 'absolute',
      background: '#4DAEFF',
      zIndex: '88888'
    }
  }
}

export function defaultOptions(): MagicDragOptions {
	return deepClone(_defaultOptions)
}


const allTarget = []
const allContainer = []
export function allElement() {
	return {
		allTarget,
		allContainer
	}
}

export function defaultState() {
	const targetState = reactive({
		left: 0,
		top: 0,
		height: 0,
		width: 0,
		isPress: false,
		isLock: false
	})
	const pointState = reactive({
		left: 0,
		top: 0,
		direction: null,
		isPress: false,
		movementX: 0,
		movementY: 0
	})
	return { targetState, pointState }
}

// the target element being manipulated
// 操作的目标元素和容器元素
let $target = ref(null), $container = ref(null)
// coordinates and dimensions of the target element - 目标元素的坐标和尺寸
let initialTarget
// save contour point - 保存轮廓点
let pointElements
// 容器元素的坐标信息
let containerInfo
// It is used to record the position information of each contour point when the target element is pressed
// 用于记录目标元素被按下时各个轮廓点的位置信息
let downPointPosition
export function storingDataContainer() {
	return { $target, $container, initialTarget, pointElements, containerInfo, downPointPosition }
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
}
