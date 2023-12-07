import { Ref, ref, reactive } from '@vue/reactivity'
import { Direction } from './magicDrag'
import { MagicDragOptions } from "./globalData";

interface PublicState {
	allTarget: HTMLElement[]
	allContainer: HTMLElement[]
	pointElements: { [key in Direction]?: HTMLElement }
	downPointPosition: { [key in Direction]?: [number, number] }
	containerInfo: Partial<Record<'width' | 'height' | 'offsetLeft' | 'offsetTop', number>>
	publicCoordinate: {} // 选中元素的坐标信息 - initialTarget
	publicTarget: Ref<HTMLElement>  // 处于选中状态的目标元素 - $target
	publicContainer: Ref<HTMLElement> // 容器元素 - $container
	options: MagicDragOptions
	pointState: any // 轮廓点的响应式状态
	targetState: any // 目标元素的响应式状态
}
interface PrivateState {
	width: number
	height: number
	left: number
	top: number
	container: HTMLElement
	target: HTMLElement
	getStateData(): any // 获取状态数据（不包含target、container等元素信息）
}
type MagicState = PublicState | PrivateState

class BuildState {
	private _publicState: PublicState = createPublicState()
	constructor() {}
	get publicState() {
		return this._publicState
	}
	privateState() {}
}
function createPrivateState(): any {
	return {}
}
function createPublicState(): any {
	return {
		allTarget: [],
		allContainer: [],
		$target: ref(null),
		$container: ref(null),
		initialTarget: null,
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
		// pointElements: {},
		// downPointPosition: {},
		// containerInfo: {},
		// publicCoordinate: {}
	}
}

export default new BuildState()
