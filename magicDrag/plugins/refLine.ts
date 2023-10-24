import { Plugin, State } from '../functions'
import {mergeObject} from "../utils/tools";

const tipWidth = 24, tipHeight = 14

declare global {
  interface HTMLElement {
		pos: any
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

function mountAssistMethod(element: HTMLElement) {
	element.show = function(coordinate) {
		if (coordinate) {
			this.style.width = coordinate.width + 'px'
			this.style.height = coordinate.height + 'px'
			this.style.left = coordinate.left + 'px'
			this.style.top = coordinate.top + 'px'
		}
		this.style.display = 'block'
	}
	element.hide = function() {
		this.style.display = 'none'
	}
	element.isShow = function() {
		return this.style.display !== 'none'
	}
}

interface RefLineOptions {
	gap?: number,
	adsorbAfterStopDiff?: boolean
	showRefLine?: boolean
	adsorb?: boolean
	showDistance?: boolean
	showShadow?: boolean
}
const defaultOptions = {
	gap: 3,
	adsorbAfterStopDiff: false,
	showRefLine: true,
	adsorb: true,
	showDistance: true,
	showShadow: true
}
export default class RefLine implements Plugin {
	name: string
	private lines: Record<string, HTMLElement> = { xt: null, xc: null, xb: null, yl: null, yc: null, yr: null }
	private tipEls: Record<string, HTMLElement> = { X: null, Y: null }
	private isHasAdsorbElementX = false
	private isHasAdsorbElementY = false
	private isCenterX = false
	private isCenterY = false
	private rectManager: MagicRect
	constructor(private readonly options: RefLineOptions = defaultOptions) {
		this.name = 'refLine'
		this.options = mergeObject(defaultOptions, this.options)
	}
	init() {
		this.createLines()
		this.createTipEl()
		this.rectManager = new MagicRect(this.options)
	}
	createLines() {
		for (const key in this.lines) {
			const node = this.lines[key] = document.createElement('div')  as HTMLElement

			node.classList.add('ref-line', key)
			// 以x/y开头，说明是与x/y轴平行的线
			node.style.cssText = `display:none;opacity:0.7;position:absolute;background:#4DAEFF;
				z-index: 99999;${key[0] === 'x' ? 'width:100%;height:1px;left:0;' : 'width:1px;height:100%;top:0;'}`

			// 挂载一些辅助方法
			mountAssistMethod(node)
			document.body.appendChild(node)
		}
	}
	createTipEl() {
		for (const elKey in this.tipEls) {
			const el = document.createElement('div')
			el.style.cssText = `position: absolute;padding: 2px 5px;font-size: 12px;background: #0086FF;
				z-index: 20001106;border-radius: 7px;width: ${tipWidth}px;height: ${tipHeight}px;color: #fff;
				text-align: center;line-height: 14px;display: none;`
			mountAssistMethod(el)
			document.body.appendChild(el)
			this.tipEls[elKey] = el
		}
	}
	unbind() {
		for (const lineKey in this.lines) {
			this.lines[lineKey].remove()
		}
		this.lines = null
	}
	drag({ elementParameter, stateParameter, globalDataParameter, optionParameter }: State, { movement, _updateContourPointPosition, _updateState }) {
		const adsorbCallback = ({ top, left }) => {
			movement.x -= left
			movement.y -= top
			_updateContourPointPosition(movement)
			_updateState(movement)
		}
		this.startCheck({ elementParameter }, 'drag', adsorbCallback)
	}
	resize({ elementParameter }: State, { movementX, movementY, _updateTargetStyle, _updatePointPosition }) {
		const adsorbCallback = ({ top, left }) => {
			movementX.value -= left
			movementY.value -= top
			_updateTargetStyle({ movementX, movementY })
			_updatePointPosition({ movementX, movementY })
		}
		this.startCheck({ elementParameter }, 'resize', adsorbCallback)
	}
	targetPressChange(isPress: boolean, elementParameter) {
		isPress
			? this.startCheck({ elementParameter }, 'drag')
			: this.checkEnd()
	}
	pointPressChange(isPress: boolean, elementParameter) {
		isPress
			? this.startCheck({ elementParameter }, 'drag')
			: this.hideRefLine()
	}

	// 检查是否有达到吸附条件的元素
	startCheck({ elementParameter }, way, adsorbCallback?) {

		this.rectManager.setElement(elementParameter.allTarget, elementParameter.privateTarget)

		// 获取被拖拽元素相对视口的位置
		const checkDragRect = this.rectManager.excludeDragRect(elementParameter.privateTarget)

		// 开始下一次 check 的重置操作
		this.checkEnd()
		const self = this

		// 遍历nodeList
		Array.from(checkDragRect).forEach((item: DragDOMRect) => {
			// 如果已经有元素执行吸附操作，是否停止与其他元素对比
			// if (this.whetherStop) return

			// 为每个元素都删除 ref-line-active 这个类名
			item.el.classList.remove('ref-line-active')

			if (item === elementParameter.privateTarget) return

			this.buildConditions(item)
			this.executeCheck(checkParameter())
			this.options.showRefLine && this.executeShow(checkParameter())
			this.options.adsorb && this.executeAdsorb(checkParameter())

			function checkParameter() {
				return {
					way,
					adsorbCallback,
					anotherRect: item,
					dragRect: self.rectManager.selectedRect,
					showSituation: self.rectManager.showSituation,
					conditions: self.rectManager.compareConditions
				}
			}
		})
		this.executeShowDistanceTip()
	}
	// 显示距离提示
	executeShowDistanceTip() {
		for (const tipKey in this.rectManager.tipDistance) {
			this.tipEls[tipKey].show(this.rectManager.tipDistance[tipKey].position)
			this.tipEls[tipKey].innerText = this.rectManager.tipDistance[tipKey].value
		}
	}
	// 构建对比情况
	buildConditions(item) {
		this.rectManager.buildCompareConditions(item, this.lines)
	}
	// 将所有有关Rect的操作全部抽成另一个类
	executeCheck({ conditions, way, dragRect, anotherRect }) {
		for (let adsorbKey in conditions) {
			conditions[adsorbKey].forEach((condition) => {
				if (!condition.isNearly) return

				// TODO 没有用的代码
				anotherRect.el.classList.add('ref-line-active')

				// 设置线的位置（top/left）
				condition.lineNode.style[adsorbKey] = `${condition.lineValue}px`

				if (way === 'drag') {
					// 显示达到吸附条件的线，如果一个方向已经有一条线满足吸附条件了，那么必须宽高相等才能显示其他线
					if ((!this.isHasAdsorbElementX && adsorbKey === 'left') || (!this.isHasAdsorbElementY && adsorbKey === 'top')) {
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
					this.isHasAdsorbElementY = true
					this.isCenterY = this.isCenterY || condition.isCenter
				} else {
					this.isHasAdsorbElementX = true
					this.isCenterX = this.isCenterX || condition.isCenter
				}
			})
		}
	}
	// 显示参考线操作
	executeShow({ showSituation }) {
		for (const adsorbKey in showSituation) {
			[...this.rectManager.showSituation[adsorbKey]].forEach(item => item.show(item.pos))
		}
	}
	// 吸附操作
	executeAdsorb({ conditions, way, adsorbCallback }) {
		let topList = conditions.top, leftList = conditions.left
		if (way === 'resize') {
			// MARK X轴有满足吸附条件的元素 而且 X轴的是中间的线则过滤掉中间的线（即resize时中间的线不吸附）
			(this.isHasAdsorbElementX && this.isCenterX) && (leftList = leftList.filter((item: any) => !item.isCenter));
			(this.isHasAdsorbElementY && this.isCenterY) && (topList = topList.filter((item: any) => !item.isCenter))
		}

		if (this.isHasAdsorbElementX || this.isHasAdsorbElementY) adsorbCallback?.({
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
		this.isHasAdsorbElementY = false
		this.isHasAdsorbElementX = false
		this.isCenterY = false
		this.isCenterX = false
		// 隐藏所有标线
		Object.values(this.lines).forEach((item: HTMLElement) => item.hide())
		// 获取所有类名包含 ref-line-active 的元素，然后为这些元素删除 ref-line-active 这个类名
		Array.from(document.querySelectorAll('.ref-line-active'))
			.forEach((item) => item.classList.remove('ref-line-active'))
	}
	hideTip() {
		console.log('hide')
		for (const elKey in this.tipEls) {
			this.tipEls[elKey].hide()
		}
	}
	get whetherStop() {
		return this.isHasAdsorbElementX || this.isHasAdsorbElementY && this.options.adsorbAfterStopDiff
	}
}


class MagicRect {
	private _selectedRect: DragDOMRect
	private _domRects: DragDOMRect[] = [] // 描述所有元素的尺寸信息
	private _showSituation: Record<string, Set<HTMLElement>> = {} // 描述辅助线的显示情况
	private _tipDistance: Record<string, any> = {}
	private _compareConditions
	constructor(private options) {}
	setElement(allEle: HTMLElement[], dragEle: HTMLElement) {
		this._domRects = allEle.map(ele => this.sizeDescribe(ele))
		this._selectedRect = this.sizeDescribe(dragEle)
	}
	sizeDescribe(element: HTMLElement): DragDOMRect {
		const rect = element.getBoundingClientRect()
		return {
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			el: element,
			halfHeight: rect.height / 2,
			halfWidth: rect.width / 2
		}
	}
	// 除当前拖拽元素外其余元素的 DragDOMRect 信息
	excludeDragRect(dragEle: HTMLElement) {
		return this._domRects.filter(
			rect => rect.el !== dragEle
		)
	}
	getNearlyRect(direction, refValue) {
		const _this = this
		const nearlyRect = []
		this.excludeDragRect(this.selectedRect.el).forEach(rect => {
			if (direction === 'top' && topIsNear(rect, refValue)) {
				nearlyRect.push(rect)
			} else if (direction === 'left' && leftIsNear(rect, refValue)) {
				nearlyRect.push(rect)
			}
		})
		return nearlyRect
		function topIsNear(rect, refValue) {
			const nearTop = _this._isNearly(rect.top, refValue)
			const nearTopCenter = _this._isNearly(rect.bottom, refValue)
			const nearBottom = _this._isNearly(rect.top + rect.halfHeight, refValue)
			return nearBottom || nearTopCenter || nearTop
		}
		function leftIsNear(rect, refValue) {
			const nearLeft = _this._isNearly(rect.left, refValue)
			const nearRight = _this._isNearly(rect.right, refValue)
			const nearLeftCenter = _this._isNearly(rect.left + rect.halfWidth, refValue)
			return nearRight || nearLeftCenter || nearLeft
		}
	}
	getRefLineCoordinate(
		{ otherRects, dragRect },
		{ direction, directionValue }
	) {
		const pos = {} as any
		const { leftList, topList, rightList, bottomList } = wholeDirectionValue(otherRects)
		if (direction === 'top') {
			const { max, min } = getMaxAndMin(...leftList, ...rightList, dragRect.left, dragRect.right)
			pos.width = max - min
			pos.height = 1
			pos.left = Math.min(...leftList, dragRect.left)
			pos.top = directionValue
		} else {
			const { max, min } = getMaxAndMin(...topList, ...bottomList, dragRect.top, dragRect.bottom)
			pos.width = 1
			pos.height = max - min
			pos.left = directionValue
			pos.top = Math.min(...topList, dragRect.top)
		}
		return pos
		function wholeDirectionValue(rectList) {
			const leftList = [], topList = [], rightList = [], bottomList = []
			rectList.forEach(rect => {
				leftList.push(rect.left)
				topList.push(rect.top)
				rightList.push(rect.right)
				bottomList.push(rect.bottom)
			})
			return {
				leftList, topList, rightList, bottomList
			}
		}
		function getMaxAndMin(...rest) {
			const min = Math.min(...rest)
			const max = Math.max(...rest)
			return {
				min,
				max
			}
		}
	}

	// 添加需要显示参考线对应的条件信息和显示方向
	appendCondition(condition, adsorbKey, anotherRect) {
		if (!this._showSituation[adsorbKey]) this._showSituation[adsorbKey] = new Set()
		this._showSituation[adsorbKey].add(condition.lineNode)
		const nearlyRect = this.getNearlyRect(adsorbKey, condition.lineValue)
		condition.lineNode.pos = this.getRefLineCoordinate(
			{ otherRects: nearlyRect, dragRect: this.selectedRect },
			{ direction: adsorbKey, directionValue: condition.lineValue }
		)
		this.calculateDistance(adsorbKey, this.selectedRect, anotherRect, condition)
	}
	calculateDistance(adsorbKey, dragRect, anotherRect, condition) {
		const distance = { value: 0, position: { left: 0, top: 0 } }
		// MARK 1.元素未相交 2.元素相交
		// MARK 吸附后distance = 0
		// // Y轴方向对齐, 计算X轴方向距离
		if (adsorbKey === 'left') calculateYDistance()
		// X轴方向对齐, 计算Y轴方向距离
		if (adsorbKey === 'top') calculateXDistance()
		function calculateYDistance() {
			// 未相交 - dragRect 在上面
			if (dragRect.bottom < anotherRect.top) {
				distance.value = anotherRect.top - dragRect.bottom
				distance.position.top = dragRect.bottom + distance.value / 2 - tipHeight / 2
				distance.position.left = condition.lineValue - tipWidth / 2
			}
			// 未相交 - dragRect 在下面
			if (dragRect.top > anotherRect.bottom) {
				distance.value = dragRect.top - anotherRect.bottom
				distance.position.top = anotherRect.bottom + distance.value / 2 - tipHeight / 2
				distance.position.left = condition.lineValue - tipWidth / 2
			}
		}
		function calculateXDistance() {
			// 未相交 - dragRect 在左边
			if (dragRect.right < anotherRect.left) {
				distance.value = anotherRect.left - dragRect.right
				distance.position.left = dragRect.right + distance.value / 2 - tipWidth / 2
				distance.position.top = condition.lineValue - tipHeight / 2
			}
			// 未相交 - dragRect 在右边
			if (dragRect.left > anotherRect.right) {
				distance.value = dragRect.left - anotherRect.right
				distance.position.left = anotherRect.right + distance.value / 2 - tipWidth / 2
				distance.position.top = condition.lineValue - tipHeight / 2
			}
		}

		this._tipDistance[revertKey(adsorbKey)] = distance
		function revertKey(adsorbKey) {
			return adsorbKey === 'left' ? 'Y' : 'X'
		}
	}
	// 检查两个元素是否相交
	isIntersect(adsorbKey, dragRect, anotherRect) {
		const intersectSituation: any = {}
		if (adsorbKey === 'left') {
			if (isBelow()) intersectSituation.dragRectIsBelow = true
			if (onTop()) intersectSituation.dragRectOnTop = true
			if (dragIncluded()) intersectSituation.dragRectIsIncluded = true
			if (anotherIncluded()) intersectSituation.anotherRectIsIncluded = true
		}
		function isBelow() {
			return dragRect.top > anotherRect.top && dragRect.top < anotherRect.bottom
		}
		function onTop() {
			return dragRect.top < anotherRect.top && dragRect.bottom > anotherRect.top
		}
		function dragIncluded() {
			return dragRect.top > anotherRect.top && dragRect.bottom < anotherRect.bottom
		}
		function anotherIncluded() {
			return dragRect.top < anotherRect.top && dragRect.bottom > anotherRect.bottom
		}
		return intersectSituation
	}
	resetSituation() {
		this._showSituation = {}
	}
	resetTipDistance() {
		this._tipDistance = {}
	}
	// 选中元素的DragDomRect信息
	get selectedRect() {
		return { ...this._selectedRect }
	}
	get rectList() {
		return this._domRects.slice()
	}
	get showSituation() {
		return { ...this._showSituation }
	}
	get compareConditions() {
		return { ...this._compareConditions }
	}
	get tipDistance() {
		return { ...this._tipDistance }
	}

	buildCompareConditions(anotherRect: DragDOMRect, lines) {
		const { halfWidth: dragWidthHalf, halfHeight: dragHeightHalf } = this.selectedRect
		const { top, height, bottom, left, width, right, halfHeight: itemHeightHalf, halfWidth: itemWidthHalf } = anotherRect
		/*
		* eg：this._isNearly(this.selectedRect.bottom, top)
		* 如果被拖拽元素的底边与参考元素的顶边达到吸附条件时
		* 那么标线需要显示的位置就是，lineValue： 参考元素的顶部top
		* 被拖拽元素需要显示的位置就是 dragValue：参考元素的top - 拖拽元素的高度
		* 画图看更直观一些
		* */
		this._compareConditions = {
			// 对比top - 检查X轴
			top: [
				// xt-top 被拖拽元素的顶边与参考元素的顶边达到吸附条件
				{
					isNearly: this._isNearly(this.selectedRect.top, top), // 是否达到吸附条件
					lineNode: lines.xt, // 对应的真实DOM
					lineValue: top, // x轴上面那条线的的top（相对视口顶部的距离）
					dragValue: top,
					distance: this.selectedRect.top - top,
					equality: height === this.selectedRect.height
				},
				// xt-bottom 被拖拽元素的底边与参考元素的顶边达到吸附条件
				{
					isNearly: this._isNearly(this.selectedRect.bottom, top),
					lineNode: lines.xt,
					lineValue: top, // x轴上面那条线的的top
					dragValue: top - this.selectedRect.height,
					distance: this.selectedRect.bottom - top,
					equality: height === this.selectedRect.height
				},
				// xc 被拖拽元素的x轴中心与参考元素的x轴中心达到吸附条件
				{
					isNearly: this._isNearly(this.selectedRect.top + dragHeightHalf, top + itemHeightHalf),
					lineNode: lines.xc,
					lineValue: top + itemHeightHalf,
					dragValue: top + itemHeightHalf - dragHeightHalf, // 如果这个值 <= gap，说明达到吸附条件
					distance: this.selectedRect.top + dragHeightHalf - (top + itemHeightHalf),
					equality: height === this.selectedRect.height,
					isCenter: true
				},
				// xb-bottom 被拖拽元素的底边与参考元素的底边达到吸附条件
				{
					isNearly: this._isNearly(this.selectedRect.bottom, bottom),
					lineNode: lines.xb,
					lineValue: bottom,
					dragValue: bottom - this.selectedRect.height,
					distance: this.selectedRect.bottom - bottom,
					equality: height === this.selectedRect.height
				},
				// xb-top 被拖拽元素的顶边与参考元素的底边达到吸附条件
				{
					isNearly: this._isNearly(this.selectedRect.top, bottom),
					lineNode: lines.xb,
					lineValue: bottom,
					dragValue: bottom,
					distance: this.selectedRect.top - bottom,
					equality: height === this.selectedRect.height
				}
			],
			// 对比left - 检查Y轴
			left: [
				// yl-left
				{
					isNearly: this._isNearly(this.selectedRect.left, left),
					lineNode: lines.yl,
					lineValue: left,
					dragValue: left,
					distance: this.selectedRect.left - left,
					equality: width === this.selectedRect.width
				},
				// yl-right
				{
					isNearly: this._isNearly(this.selectedRect.right, left),
					lineNode: lines.yl,
					lineValue: left,
					dragValue: left - this.selectedRect.width,
					distance: this.selectedRect.right - left,
					equality: width === this.selectedRect.width
				},
				// yc
				{
					isNearly: this._isNearly(this.selectedRect.left + dragWidthHalf, left + itemWidthHalf),
					lineNode: lines.yc,
					lineValue: left + itemWidthHalf,
					dragValue: left + itemWidthHalf - dragWidthHalf,
					distance: this.selectedRect.left + dragWidthHalf - (left + itemWidthHalf),
					equality: width === this.selectedRect.width,
					isCenter: true
				},
				// yr-left
				{
					isNearly: this._isNearly(this.selectedRect.right, right),
					lineNode: lines.yr,
					lineValue: right,
					dragValue: right - this.selectedRect.width,
					distance: this.selectedRect.right - right,
					equality: width === this.selectedRect.width
				},
				// yr-right
				{
					isNearly: this._isNearly(this.selectedRect.left, right),
					lineNode: lines.yr,
					lineValue: right,
					dragValue: right,
					distance: this.selectedRect.left - right,
					equality: width === this.selectedRect.width
				}
			]
		}
	}
	_isNearly(dragValue, targetValue, isStrict = false) {
		return isStrict
			? dragValue === targetValue
			: Math.abs(dragValue - targetValue) <= this.options.gap
	}
}
