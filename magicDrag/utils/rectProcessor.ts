
export default class RectProcessor {
	private _selectedRect: DragDOMRect // 拖拽（选中）元素的DragDOMRect描述对象
	private _domRects: DragDOMRect[] = [] // 描述所有元素的尺寸信息
	private _showSituation: Record<string, Set<any>> = {} // 描述辅助线显示情况的信息
	private _tipDistance: Record<string, any> = {} // 描述距离提示的信息
	private _compareConditions // 拖拽元素与其他元素的对比情况
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

		const self = this
		const state = recomposeCondition(condition, adsorbKey, anotherRect)
		this._showSituation[adsorbKey].add(state)

		function recomposeCondition(condition, adsorbKey, anotherRect) {
			const state: any = {}
			state.lineValue = condition.lineValue
			state.anotherRect = anotherRect
			state.lineNode = condition.lineNode
			state.nearlyRect = self.getNearlyRect(adsorbKey, condition.lineValue)
			state.isCenter = condition.isCenter
			state.distance = condition.distance
			state.position = self.getRefLineCoordinate(
				{ otherRects: state.nearlyRect, dragRect: self.selectedRect },
				{ direction: adsorbKey, directionValue: condition.lineValue }
			)
			return state
		}
	}
	calculateDistance(adsorbKey, dragRect, anotherRect, newCondition) {
		const distance = { value: 0, position: { left: 0, top: 0 } }
		const tipWidth = parseInt(this.options.customStyle.tipStyle.width)
		const tipHeight = parseInt(this.options.customStyle.tipStyle.height)
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
				distance.position.left = newCondition.lineValue - tipWidth / 2
			}
			// 未相交 - dragRect 在下面
			if (dragRect.top > anotherRect.bottom) {
				distance.value = dragRect.top - anotherRect.bottom
				distance.position.top = anotherRect.bottom + distance.value / 2 - tipHeight / 2
				distance.position.left = newCondition.lineValue - tipWidth / 2
			}
		}
		function calculateXDistance() {
			// 未相交 - dragRect 在左边
			if (dragRect.right < anotherRect.left) {
				distance.value = anotherRect.left - dragRect.right
				distance.position.left = dragRect.right + distance.value / 2 - tipWidth / 2
				distance.position.top = newCondition.lineValue - tipHeight / 2
			}
			// 未相交 - dragRect 在右边
			if (dragRect.left > anotherRect.right) {
				distance.value = dragRect.left - anotherRect.right
				distance.position.left = anotherRect.right + distance.value / 2 - tipWidth / 2
				distance.position.top = newCondition.lineValue - tipHeight / 2
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
	isContains(container: HTMLElement, elements: HTMLElement[]) {
		const containerRect = container.getBoundingClientRect()
		const rectList = elements.map(el => el.getBoundingClientRect())
		const containList = []
		rectList.forEach(rect => {
			if (singleContain(containerRect, rect)) containList.push(rect)
		})
		function singleContain(containerRect: DOMRect, rect: DOMRect) {
			return containerRect.left < rect.left
				&& containerRect.right > rect.right
				&& containerRect.top < rect.top
			 	&& containerRect.bottom > rect.bottom
		}
		return containList
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
		*
		* MARK 是否可以通过一个策略对象来计算出对比情况
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
