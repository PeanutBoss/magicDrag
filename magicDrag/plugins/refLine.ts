import { Plugin, State, StateManager } from '../manager'
import { numberToStringSize, removeElements, setStyle } from '../utils/tools'
import { mountAssistMethod } from '../common/magicDrag'
import { MagicDragOptions } from '../common/globalData'
import RectProcessor from '../utils/rectProcessor'

export const REF_LINE_CLASS_NAME = 'ref-line'
export const DISTANCE_TIP_CLASS_NAME = 'distance-tip'

declare global {
  interface HTMLElement {
    show: (coordinate) => void
    hide: () => void
    isShow: () => boolean
    // 在这里可以添加其他自定义方法
  }

	interface DOMRect {
		el?: HTMLElement
		halfWidth?: number
		halfHeight?: number
	}

	type DragDOMRect = Partial<DOMRect>
}
type AdsorbKey = 'left' | 'top'

export interface RefLineOptions {
	gap?: number,
	showRefLine?: boolean
	adsorb?: boolean
	showDistance?: boolean
	customStyle?: MagicDragOptions['customStyle']
}
export default class RefLine implements Plugin {
	name: string
	private lines: Record<string, HTMLElement> = { xt: null, xc: null, xb: null, yl: null, yc: null, yr: null }
	private tipEls: Record<string, HTMLElement> = { X: null, Y: null }
	private isHasAdsorbElementY = false
	private isHasAdsorbElementX = false
	private isCenterX = false
	private isCenterY = false
	private rectManager: RectProcessor
	private refElement: HTMLElement
	private refElementPosition
	constructor(private readonly options: RefLineOptions, private stateManager: StateManager) {
		this.name = 'refLine'
	}
	init() {
		this.createLines()
		this.createTipEl()
		this.rectManager = new RectProcessor(this.options)
	}
	unbind() {
		removeElements(this.lines)
		removeElements(this.tipEls)
	}
	drag(dragEls, { movement, _updateContourPointPosition, _updateState, syncOtherEl }) {
		const adsorbCallback = ({ top, left }) => {
			movement.x -= left
			movement.y -= top
			_updateContourPointPosition(movement)
			_updateState(movement)
			syncOtherEl(movement)
		}
		this.startCheck(dragEls, 'drag', adsorbCallback, movement)
	}
	dragStart({ composeCoordinate, publicContainer }) {
		// 如果被选中的元素数量小于等于1，则不需要创建多选的盒子
		if (!this.stateManager.isRegionSelection) return
		const _this = this
		// 创建多选的包裹元素
		createSelectionBox()
		// 保存包裹元素的位置信息
		saveBoxStartPos()
		function createSelectionBox() {
			const el = document.createElement('div')
			setStyle(el, {
				...numberToStringSize(composeCoordinate),
				position: 'absolute'
			})
			_this.refElement = el
			publicContainer.appendChild(el)
		}
		function saveBoxStartPos() {
			_this.refElementPosition = {
				left: parseInt(_this.refElement.style.left),
				top: parseInt(_this.refElement.style.top)
			}
		}
	}
	dragEnd({ publicContainer }) {
		if (this.stateManager.isRegionSelection) removeElements([this.refElement])
		this.refElement = null
	}
	resize({ allTarget, privateTarget }: State, { movementX, movementY, _updateTargetStyle, _updatePointPosition }) {
		const adsorbCallback = ({ top, left }) => {
			movementX.value -= left
			movementY.value -= top
			_updateTargetStyle({ movementX: movementX.value, movementY: movementY.value })
			_updatePointPosition({ movementX: movementX.value, movementY: movementY.value })
		}
		this.startCheck({ allTarget, privateTarget }, 'resize', adsorbCallback)
	}
	targetPressChange(isPress: boolean, dragEls) {
		isPress
			? this.startCheck(dragEls, 'drag')
			: this.checkEnd()
	}
	pointPressChange(isPress: boolean, dragEls) {
		isPress
			? this.startCheck(dragEls, 'drag')
			: this.checkEnd()
	}
	createLines() {
		for (const key in this.lines) {
			const node = this.lines[key] = document.createElement('div')  as HTMLElement
			node.classList.add(REF_LINE_CLASS_NAME)
			node.classList.add(key)
			setStyle(node, this.options.customStyle.refLineStyle as Record<string, string>)
			// 挂载一些辅助方法
			mountAssistMethod(node)
			document.body.appendChild(node)
		}
	}
	createTipEl() {
		for (const elKey in this.tipEls) {
			const el = document.createElement('div')
			el.classList.add(DISTANCE_TIP_CLASS_NAME)
			setStyle(el, this.options.customStyle.tipStyle as Record<string, string>)
			mountAssistMethod(el)
			document.body.appendChild(el)
			this.tipEls[elKey] = el
		}
	}

	// 检查是否有达到吸附条件的元素
	startCheck(dragEls, way, adsorbCallback?, movement?) {
		const _this = this

		// 如果是多选需要主动更新包裹盒子的位置
		updateSelectionBoxPos()
		// 记录参与本次操作的所有元素
		this.rectManager.setElement(allElements(), dragElement())
		// 获取要与dragRect对比的rect对象
		const checkDragRect = this.rectManager.excludeDragRect(dragElement())
		// 开始新一轮的check需要重置上一次check的数据
		this.checkEnd()
		// 创建参考线的描述数据
		createRefLineDescribeData()
		// 显示参考线
		this.options.showRefLine && this.executeShowRefLine()
		// 执行吸附操作
		this.options.adsorb && this.executeAdsorb({ way, adsorbCallback })
		// 显示距离提示
		this.options.showDistance && showDistanceTip()
		function showDistanceTip() {
			// 计算距离信息
			_this.calculateDistance()
			// 显示距离
			_this.executeShowDistanceTip()
		}
		function createRefLineDescribeData() {
			// 遍历nodeList
			Array.from(checkDragRect).forEach((item: DragDOMRect) => {
				if (item.el === dragElement()) return

				// 构建 dragRect 与其他rect对象的关系（是否达成吸附条件）
				_this.buildConditions(item)
				// 通过上一步构建的conditions进行检查并记录
				_this.executeCheckByConditions({
					way,
					anotherRect: item,
					dragRect: _this.rectManager.selectedRect,
					conditions: _this.rectManager.compareConditions
				})
			})
		}
		// 拖拽的元素,多选的情况下是包裹的元素(未显示)
		function dragElement() {
			return _this.refElement ? _this.refElement : dragEls.privateTarget
		}
		// 对比的其他元素
		function allElements() {
			// 多选的时候还需要排除当前被选中的元素
			const notSelectedEls = dragEls.allTarget.filter(item => !_this.stateManager.regionSelectedElement.includes(item))
			// 非多选的情况下allElements中包含当前拖拽的元素，多选的情况下与其保持一致
			return [...notSelectedEls, _this.refElement]
		}
		function updateSelectionBoxPos() {
			if (_this.refElement) {
				_this.refElement.style.top = _this.refElementPosition.top + movement?.y + 'px'
				_this.refElement.style.left = _this.refElementPosition.left + movement?.x + 'px'
			}
		}
	}
	calculateDistance() {
		for (const adsorbKey in this.rectManager.showSituation) {
			const dragState = priorityCenterState(this.rectManager.showSituation[adsorbKey])
			const dragRect = this.rectManager.sizeDescribe(this.rectManager.selectedRect.el)
			this.rectManager.calculateDistance(adsorbKey, dragRect, dragState.anotherRect, dragState)
		}
		// 优先获取中间的参考线对应的condition信息
		function priorityCenterState(arrayLike) {
			return [...arrayLike].find(item => item.isCenter) || [...arrayLike][0]
		}
	}
	// 显示距离提示
	executeShowDistanceTip() {
		for (const tipKey in this.rectManager.tipDistance) {
			needShow(this.rectManager.tipDistance[tipKey].value, this.options.gap)
			&& this.tipEls[tipKey].show(this.rectManager.tipDistance[tipKey].position)

			needShow(this.rectManager.tipDistance[tipKey].value, this.options.gap)
			&& (this.tipEls[tipKey].innerText = this.rectManager.tipDistance[tipKey].value)
		}
		function needShow(distance, gap) {
			return distance > gap
		}
	}
	// 构建对比情况
	buildConditions(item) {
		this.rectManager.buildCompareConditions(item, this.lines)
	}
	executeCheckByConditions({ conditions, way, dragRect, anotherRect }) {
		for (let adsorbKey in conditions) {
			conditions[adsorbKey].forEach((condition) => {
				if (!condition.isNearly) return

				if (way === 'drag') {
					// 显示达到吸附条件的线，如果一个方向已经有一条线满足吸附条件了，那么必须宽高相等才能显示其他线
					if ((!this.isHasAdsorbElementY && adsorbKey === 'left') || (!this.isHasAdsorbElementX && adsorbKey === 'top')) {
						this.rectManager.appendCondition(condition, adsorbKey, anotherRect)
					} else {
						this.rectManager.appendCondition(condition, adsorbKey, anotherRect)
					}
				} else if (way === 'resize') {
					// 如果不是中间的线直接显示
					!condition.isCenter && this.rectManager.appendCondition(condition, adsorbKey, anotherRect)
					// MARK 某一个轴，如果是中间的线达到吸附条件，其他两条线必须也达到吸附条件才显示
					if (condition.isCenter && adsorbKey === 'top' && this.rectManager._isNearly(anotherRect.height, dragRect.height)) {
						this.rectManager.appendCondition(condition, adsorbKey, anotherRect)
					} else if (condition.isCenter && adsorbKey === 'left' && this.rectManager._isNearly(anotherRect.width, dragRect.width)) {
						this.rectManager.appendCondition(condition, adsorbKey, anotherRect)
					}
				}

				if (adsorbKey === 'top') {
					this.isHasAdsorbElementX = true
					this.isCenterX = this.isCenterX || condition.isCenter
				} else {
					this.isHasAdsorbElementY = true
					this.isCenterY = this.isCenterY || condition.isCenter
				}
			})
		}
	}
	// 显示参考线操作
	executeShowRefLine() {
		for (const adsorbKey in this.rectManager.showSituation) {
			[...this.rectManager.showSituation[adsorbKey]].forEach(item => item.lineNode.show(item.position))
		}
	}
	// 吸附操作
	executeAdsorb({ way, adsorbCallback }) {
		let topList = Array.from(this.rectManager.showSituation.top || []),
			leftList = Array.from(this.rectManager.showSituation.left || [])
		if (way === 'resize') {
			// MARK X轴有满足吸附条件的元素 而且 X轴的是中间的线则过滤掉中间的线（即resize时中间的线不吸附）
			(this.isHasAdsorbElementY && this.isCenterY) && (leftList = leftList.filter((item: any) => !item.isCenter));
			(this.isHasAdsorbElementX && this.isCenterX) && (topList = topList.filter((item: any) => !item.isCenter))
		}

		if (this.isHasAdsorbElementY || this.isHasAdsorbElementX) adsorbCallback?.({
			top: nearestInstance(topList, this.options.gap) || 0,
			left: nearestInstance(leftList, this.options.gap) || 0
		})
		function nearestInstance(list, gap) {
			return list
				.map(m => Math.abs(m.distance) <= gap? m.distance : 0)
				.find(item => Math.abs(item) > 0)
		}
	}

	checkEnd() {
		this.hideRefLine()
		this.hideTip()
		this.rectManager.resetSituation()
		this.rectManager.resetTipDistance()
	}
	hideRefLine() {
		this.isHasAdsorbElementX = false
		this.isHasAdsorbElementY = false
		this.isCenterX = false
		this.isCenterY = false
		// 隐藏所有标线
		Object.values(this.lines).forEach((item: HTMLElement) => item.hide())
	}
	hideTip() {
		for (const elKey in this.tipEls) {
			this.tipEls[elKey].hide()
		}
	}
}
