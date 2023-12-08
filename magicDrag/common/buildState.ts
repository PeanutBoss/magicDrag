import { Ref, ref, reactive } from '@vue/reactivity'
import { Direction } from './magicDrag'
import { MagicDragOptions } from './globalData'
import { generateID } from '../utils/tools'

interface PublicState {
	allTarget: HTMLElement[]
	allContainer: HTMLElement[]
	pointElements: { [key in Direction]?: HTMLElement }
	downPointPosition: { [key in Direction]?: [number, number] }
	containerInfo: Partial<Record<'width' | 'height' | 'offsetLeft' | 'offsetTop', number>>
	// publicCoordinate: {} // 选中元素的坐标信息 - initialTarget
	publicTarget: Ref<HTMLElement>  // 处于选中状态的目标元素 - $target
	publicContainer: Ref<HTMLElement> // 容器元素 - $container
	options?: MagicDragOptions
	pointState: any // 轮廓点的响应式状态
	targetState: any // 目标元素的响应式状态
}
interface PrivateState {
	width?: number
	height?: number
	left?: number
	top?: number
	coordinate: Coordinate
	id: string
	container?: HTMLElement
	privateTarget?: HTMLElement
	getStateData?(): any // 获取状态数据（不包含target、container等元素信息）
}

export type MagicState = PublicState & PrivateState

enum CoordinateKey {
	left = '_left',
	top = '_top',
	width = '_width',
	height = '_height'
}
export class Coordinate {
	left = 0
	top = 0
	width = 0
	height = 0
	public id: string
	constructor() {
		this.id = generateID()
	}
	// setValue(key: CoordinateKey, value: number) {
	// 	this[CoordinateKey[key]] = value
	// }
	setValue(key: '_left' | '_top'| '_width'| '_height', value) {
		this[key] = value
	}
	// get left() {
	// 	return this._left
	// }
	// get top() {
	// 	return this._top
	// }
	// get width() {
	// 	return this._width
	// }
	// get height() {
	// 	return this._height
	// }
	// set left(val) {
	// 	return this._left = val
	// }
	// set top(val) {
	// 	return this._top = val
	// }
	// set width(val) {
	// 	return this._width = val
	// }
	// set height(val) {
	// 	return this._height = val
	// }
	get isCoordinate() {
		return true
	}
}

class BuildState {
	private _publicState: PublicState = createPublicState()
	private _privateState: PrivateState = createPrivateState()
	constructor() {
		// return {
		// 	...this._publicState,
		// 	...this.privateState
		// }
	}
	get publicState() {
		return this._publicState
	}
	get privateState() {
		return this._privateState
	}
	static createCoordinate() {
		return new Coordinate()
	}
}
function createPrivateState(): PrivateState {
	return {
		privateTarget: null,
		coordinate: new Coordinate(),
		id: generateID()
	}
}
function createPublicState(): PublicState {
	return {
		allTarget: [],
		allContainer: [],
		publicTarget: ref(null),
		publicContainer: ref(null),
		pointElements: null,
		containerInfo: null,
		downPointPosition: null,
		targetState: reactive({
			left: 0,
			top: 0,
			height: 0,
			width: 0,
			isPress: false
		}),
		pointState: reactive({
			left: 0,
			top: 0,
			direction: null,
			isPress: false,
			movementX: 0,
			movementY: 0
		})
	}
}

export default BuildState
