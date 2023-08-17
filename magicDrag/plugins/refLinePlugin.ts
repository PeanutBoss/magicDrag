import { Plugin } from './index.ts'
import {Parameter} from "../utils/parameter";

declare global {
	interface HTMLElement {
		show: () => void
		hide: () => void
		isShow: () => boolean
		// 在这里可以添加其他自定义方法
	}
}

let lines = null

function getLines () {
	if (!lines) {
		lines = { xt: null, xc: null, xb: null, yl: null, yc: null, yr: null }
		for (const key in lines) {
			let node = lines[key] = document.createElement('div')  as HTMLElement

			node.classList.add('ref-line', key)
			// 以x/y开头，说明是与x/y轴平行的线
			node.style.cssText = `display:none;opacity:0.7;position:absolute;background:#4DAEFF;z-index: 99999;${key[0] === 'x' ? 'width:100%;height:1px;left:0;' : 'width:1px;height:100%;top:0;'}`

			// 挂上一些辅助方法
			node.show = function () {
				this.style.display = 'block'
			}
			node.hide = function () {
				this.style.display = 'none'
			}
			node.isShow = function () {
				return this.style.display !== 'none'
			}
			document.body.appendChild(node)
		}
	}
	return lines
}

class RefLine implements Plugin {
	name
	private lines
	private isHasAdsorbElementX // 是否有满足吸附条件的元素
	private isHasAdsorbElementY // 是否有满足吸附条件的元素
	private isHasAdsorbElement
	constructor(private readonly options: { gap?: number, adsorbAfterStopDiff?: boolean } = {}) {
		this.name = 'refLine'
		this.options = Object.assign(this.options, { gap: 3, adsorbAfterStopDiff: true })
	}
	init() {
		this.lines = getLines()
	}
	drag({ elementParameter, stateParameter, globalDataParameter, optionParameter }: Parameter, { movement, _updateContourPointPosition, _updateState }) {
		const { privateTarget: dragNode, allTarget } = elementParameter
		const checkNodes = allTarget.filter(node => node !== dragNode)
		// 获取被拖拽元素相对视口的位置
		let dragRect = dragNode.getBoundingClientRect()

		// 隐藏所有标线
		this.hideRefLine()

		// 计算被拖拽元素的代码提取到循环外面
		let dragWidthHalf = dragRect.width / 2
		let dragHeightHalf = dragRect.height / 2

		const { adsorbAfterStopDiff } = this.options
		// 遍历nodeList
		Array.from(checkNodes).forEach((item: HTMLElement) => {
			// 如果已经有元素执行吸附操作，就停止与其他元素对比
			if (this.isHasAdsorbElement && adsorbAfterStopDiff) return

			// 为每个元素都删除 ref-line-active 这个类名
			item.classList.remove('ref-line-active')

			if (item === dragNode) return
			// 获取每个元素相对视口的距离和元素的尺寸
			let {top, height, bottom, left, width, right} = item.getBoundingClientRect()
			// 计算参考元素的一半的尺寸，需要计算吸附后元素的位置
			let itemWidthHalf = width / 2
			let itemHeightHalf = height / 2

			/*
			* eg：this._isNearly(dragRect.bottom, top)
			* 如果被拖拽元素的底边与参考元素的顶边达到吸附条件时
			* 那么标线需要显示的位置就是，lineValue： 参考元素的顶部top
			* 被拖拽元素需要显示的位置就是 dragValue：参考元素的top - 拖拽元素的高度
			* 画图看更直观一些
			* */

			let conditions = {
				top: [
					// xt-top 被拖拽元素的顶边与参考元素的顶边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top, top), // 是否达到吸附条件
						lineNode: this.lines.xt, // 对应的真实DOM
						lineValue: top, // x轴上面那条线的的top（相对视口顶部的距离）
						dragValue: top,
						distance: dragRect.top - top,
						equality: height === dragRect.height
					},
					// xt-bottom 被拖拽元素的底边与参考元素的顶边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.bottom, top),
						lineNode: this.lines.xt,
						lineValue: top, // x轴上面那条线的的top
						dragValue: top - dragRect.height,
						distance: dragRect.bottom - top,
						equality: height === dragRect.height
					},
					// xc 被拖拽元素的x轴中心与参考元素的x轴中心达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top + dragHeightHalf, top + itemHeightHalf),
						lineNode: this.lines.xc,
						lineValue: top + itemHeightHalf,
						dragValue: top + itemHeightHalf - dragHeightHalf, // 如果这个值 <= gap，说明达到吸附条件
						distance: dragRect.top + dragHeightHalf - (top + itemHeightHalf),
						equality: height === dragRect.height
					},
					// xb-bottom 被拖拽元素的底边与参考元素的底边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.bottom, bottom),
						lineNode: this.lines.xb,
						lineValue: bottom,
						dragValue: bottom - dragRect.height,
						distance: dragRect.bottom - bottom,
						equality: height === dragRect.height
					},
					// xb-top 被拖拽元素的顶边与参考元素的底边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top, bottom),
						lineNode: this.lines.xb,
						lineValue: bottom,
						dragValue: bottom,
						distance: dragRect.top - bottom,
						equality: height === dragRect.height
					}
				],

				left: [
					// yl-left
					{
						isNearly: this._isNearly(dragRect.left, left),
						lineNode: this.lines.yl,
						lineValue: left,
						dragValue: left,
						distance: dragRect.left - left,
						equality: width === dragRect.width
					},
					// yl-right
					{
						isNearly: this._isNearly(dragRect.right, left),
						lineNode: this.lines.yl,
						lineValue: left,
						dragValue: left - dragRect.width,
						distance: dragRect.right - left,
						equality: width === dragRect.width
					},
					// yc
					{
						isNearly: this._isNearly(dragRect.left + dragWidthHalf, left + itemWidthHalf),
						lineNode: this.lines.yc,
						lineValue: left + itemWidthHalf,
						dragValue: left + itemWidthHalf - dragWidthHalf,
						distance: dragRect.left + dragWidthHalf - (left + itemWidthHalf),
						equality: width === dragRect.width
					},
					// yr-left
					{
						isNearly: this._isNearly(dragRect.right, right),
						lineNode: this.lines.yr,
						lineValue: right,
						dragValue: right - dragRect.width,
						distance: dragRect.right - right,
						equality: width === dragRect.width
					},
					// yr-right
					{
						isNearly: this._isNearly(dragRect.left, right),
						lineNode: this.lines.yr,
						lineValue: right,
						dragValue: right,
						distance: dragRect.left - right,
						equality: width === dragRect.width
					}
				]
			}

			for (let key in conditions) {
				conditions[key].forEach((condition) => {
					if (!condition.isNearly) return

					this.isHasAdsorbElement = true

					item.classList.add('ref-line-active')

					// 设置线的位置（top/left）
					condition.lineNode.style[key] = `${condition.lineValue}px`
					// 显示达到吸附条件的线
					condition.lineNode.show()
				})
			}
			if (this.isHasAdsorbElement) {
				const top = conditions.top.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0).find(item => Math.abs(item) > 0) || 0
				const left = conditions.left.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0).find(item => Math.abs(item) > 0) || 0
				// const top = Math.min(...conditions.top.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0))
				// const left = Math.min(...conditions.left.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0))
				movement.x -= left
				movement.y -= top
				_updateContourPointPosition(movement)
				_updateState(movement)

			}
		})
	}
	resize({ elementParameter, stateParameter, globalDataParameter, optionParameter }: Parameter, { movementX, movementY, _updateTargetStyle, _updatePointPosition }) {
		const { privateTarget: dragNode, allTarget } = elementParameter
		const checkNodes = allTarget.filter(node => node !== dragNode)
		// 获取被拖拽元素相对视口的位置
		let dragRect = dragNode.getBoundingClientRect()

		// 隐藏所有标线
		this.hideRefLine()

		// 计算被拖拽元素的代码提取到循环外面
		let dragWidthHalf = dragRect.width / 2
		let dragHeightHalf = dragRect.height / 2

		const { adsorbAfterStopDiff } = this.options
		// 遍历nodeList
		Array.from(checkNodes).forEach((item: HTMLElement) => {
			// 如果已经有元素执行吸附操作，就停止与其他元素对比
			if (this.isHasAdsorbElement && adsorbAfterStopDiff) return

			// 为每个元素都删除 ref-line-active 这个类名
			item.classList.remove('ref-line-active')

			if (item === dragNode) return
			// 获取每个元素相对视口的距离和元素的尺寸
			let {top, height, bottom, left, width, right} = item.getBoundingClientRect()
			// 计算参考元素的一半的尺寸，需要计算吸附后元素的位置
			let itemWidthHalf = width / 2
			let itemHeightHalf = height / 2

			/*
			* eg：this._isNearly(dragRect.bottom, top)
			* 如果被拖拽元素的底边与参考元素的顶边达到吸附条件时
			* 那么标线需要显示的位置就是，lineValue： 参考元素的顶部top
			* 被拖拽元素需要显示的位置就是 dragValue：参考元素的top - 拖拽元素的高度
			* 画图看更直观一些
			* */

			let conditions = {
				top: [
					// xt-top 被拖拽元素的顶边与参考元素的顶边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top, top), // 是否达到吸附条件
						lineNode: this.lines.xt, // 对应的真实DOM
						lineValue: top, // x轴上面那条线的的top（相对视口顶部的距离）
						dragValue: top,
						distance: dragRect.top - top
					},
					// xt-bottom 被拖拽元素的底边与参考元素的顶边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.bottom, top),
						lineNode: this.lines.xt,
						lineValue: top, // x轴上面那条线的的top
						dragValue: top - dragRect.height,
						distance: dragRect.bottom - top
					},
					// xc 被拖拽元素的x轴中心与参考元素的x轴中心达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top + dragHeightHalf, top + itemHeightHalf, true),
						lineNode: this.lines.xc,
						lineValue: top + itemHeightHalf,
						dragValue: top + itemHeightHalf - dragHeightHalf, // 如果这个值 <= gap，说明达到吸附条件
						distance: dragRect.top + dragHeightHalf - (top + itemHeightHalf)
					},
					// xb-bottom 被拖拽元素的底边与参考元素的底边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.bottom, bottom),
						lineNode: this.lines.xb,
						lineValue: bottom,
						dragValue: bottom - dragRect.height,
						distance: dragRect.bottom - bottom
					},
					// xb-top 被拖拽元素的顶边与参考元素的底边达到吸附条件
					{
						isNearly: this._isNearly(dragRect.top, bottom),
						lineNode: this.lines.xb,
						lineValue: bottom,
						dragValue: bottom,
						distance: dragRect.top - bottom
					}
				],

				left: [
					// yl-left
					{
						isNearly: this._isNearly(dragRect.left, left),
						lineNode: this.lines.yl,
						lineValue: left,
						dragValue: left,
						distance: dragRect.left - left
					},
					// yl-right
					{
						isNearly: this._isNearly(dragRect.right, left),
						lineNode: this.lines.yl,
						lineValue: left,
						dragValue: left - dragRect.width,
						distance: dragRect.right - left
					},
					// yc
					{
						isNearly: this._isNearly(dragRect.left + dragWidthHalf, left + itemWidthHalf, true),
						lineNode: this.lines.yc,
						lineValue: left + itemWidthHalf,
						dragValue: left + itemWidthHalf - dragWidthHalf,
						distance: dragRect.left + dragWidthHalf - (left + itemWidthHalf)
					},
					// yr-left
					{
						isNearly: this._isNearly(dragRect.right, right),
						lineNode: this.lines.yr,
						lineValue: right,
						dragValue: right - dragRect.width,
						distance: dragRect.right - right
					},
					// yr-right
					{
						isNearly: this._isNearly(dragRect.left, right),
						lineNode: this.lines.yr,
						lineValue: right,
						dragValue: right,
						distance: dragRect.left - right
					}
				]
			}

			for (let key in conditions) {
				conditions[key].forEach((condition) => {
					if (!condition.isNearly) return

					this.isHasAdsorbElement = true

					// MARK 这里只是达到吸附条件，但是元素和线的位置还需要手动更新才能达到吸附后的效果
					item.classList.add('ref-line-active')

					// 设置被拖拽元素的位置（top/left）
					// dragNode.style[key] = `${condition.dragValue}px`

					// 设置线的位置（top/left）
					condition.lineNode.style[key] = `${condition.lineValue}px`
					// 显示达到吸附条件的线
					condition.lineNode.show()
				})
			}
			if (this.isHasAdsorbElement) {
				const top = conditions.top.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0).find(item => Math.abs(item) > 0) || 0
				const left = conditions.left.map(m => Math.abs(m.distance) <= this.options.gap ? m.distance : 0).find(item => Math.abs(item) > 0) || 0
				movementX.value -= left
				movementY.value -= top
				_updateTargetStyle({ movementX, movementY })
				_updatePointPosition({ movementX, movementY })
			}
		})
	}

	unbind() {}
	hideRefLine() {
		this.isHasAdsorbElement = false
		// 隐藏所有标线
		Object.values(this.lines).forEach((item) => item.hide())
		// 获取所有类名包含 ref-line-active 的元素，然后为这些元素删除 ref-line-active 这个类名
		Array.from(document.querySelectorAll('.ref-line-active')).forEach((item) => item.classList.remove('ref-line-active'))
	}
	_isNearly(dragValue, targetValue, isStrict = false) {
		return isStrict
			? dragValue === targetValue
			: Math.abs(dragValue - targetValue) <= this.options.gap
	}
}

export default RefLine
