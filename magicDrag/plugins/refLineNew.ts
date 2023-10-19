import { Plugin, State } from '../functions'
import {mergeObject} from "../utils/tools";

declare global {
  interface HTMLElement {
    show: () => void
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

/*
* TODO 多个元素对比
*  YR吸附之后YL没反应
*  YL吸附之后YR可以继续吸附但YR吸附后YL不显示了
* */

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
  adsorb: false,
  showDistance: true,
  showShadow: true
}
export default class RefLine implements Plugin {
  name: string
  private lines
  private isHasAdsorbElementX = false
  private isHasAdsorbElementY = false
  private isCenterX = false
  private isCenterY = false
  constructor(private readonly options: RefLineOptions = defaultOptions) {
    this.name = 'refLine'
    this.options = mergeObject(defaultOptions, this.options)
  }
  init() {
    this.lines = getLines()
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
    this.checkAdsorb({ elementParameter }, 'drag', adsorbCallback)
  }
  resize({ elementParameter }: State, { movementX, movementY, _updateTargetStyle, _updatePointPosition }) {
    const adsorbCallback = ({ top, left }) => {
      movementX.value -= left
      movementY.value -= top
      _updateTargetStyle({ movementX, movementY })
      _updatePointPosition({ movementX, movementY })
    }
    this.checkAdsorb({ elementParameter }, 'resize', adsorbCallback)
  }
  targetPressChange(isPress: boolean, elementParameter) {
    isPress
      ? this.checkAdsorb({ elementParameter }, 'drag')
      : this.hideRefLine()
  }
  pointPressChange(isPress: boolean, elementParameter) {
    isPress
      ? this.checkAdsorb({ elementParameter }, 'drag')
      : this.hideRefLine()
  }

  // 检查是否有达到吸附条件的元素
  checkAdsorb({ elementParameter }, way, adsorbCallback?) {
    const { privateTarget: dragNode, allTarget } = elementParameter
    const checkNodes = allTarget.filter(node => node !== dragNode)
    // 获取被拖拽元素相对视口的位置
    const dragRect = this.sizeDescribe(dragNode)
    const checkDragRect = checkNodes.map(m => this.sizeDescribe(m))

    // 隐藏所有标线
    this.hideRefLine()

    // 遍历nodeList
    Array.from(checkDragRect).forEach((item: DragDOMRect) => {
      // 如果已经有元素执行吸附操作，就停止与其他元素对比
      if (this.whetherStop) return

      // 为每个元素都删除 ref-line-active 这个类名
      item.el.classList.remove('ref-line-active')

      if (item === dragNode) return

      const conditions = this.directionConditions(dragRect, item)

      this.executeCheck(checkParameter(), this.options.showRefLine)
      this.options.adsorb && this.executeAdsorb(checkParameter())

      function checkParameter() {
        return { way, dragRect, anotherRect: item, conditions, adsorbCallback }
      }
    })
  }
  executeCheck({ conditions, way, dragRect, anotherRect }, needShowRef) {
    for (let key in conditions) {
      conditions[key].forEach((condition) => {
        if (!condition.isNearly) return

        anotherRect.el.classList.add('ref-line-active')

        // 设置线的位置（top/left）
        condition.lineNode.style[key] = `${condition.lineValue}px`

        // TODO 将显示参考线的操作抽离出来，检查操作完成后，组合一个描述显示情况的数据，根据数据显示参考线
        if (way === 'drag') {
          // 显示达到吸附条件的线，如果一个方向已经有一条线满足吸附条件了，那么必须宽高相等才能显示其他线
          if ((!this.isHasAdsorbElementX && key === 'left') || (!this.isHasAdsorbElementY && key === 'top')) {
            needShowRef && condition.lineNode.show()
          } else {
            needShowRef && condition.equality && condition.lineNode.show()
          }
        } else if (way === 'resize') {
          // 如果不是中间的线直接显示
          needShowRef && !condition.isCenter && condition.lineNode.show()
          // MARK 某一个轴，如果是中间的线达到吸附条件，其他两条线必须也达到吸附条件才显示
          if (condition.isCenter && key === 'top' && this._isNearly(anotherRect.height, dragRect.height)) {
            needShowRef && condition.lineNode.show()
          } else if (condition.isCenter && key === 'left' && this._isNearly(anotherRect.width, dragRect.width)) {
            needShowRef && condition.lineNode.show()
          }
        }

        if (key === 'top') {
          this.isHasAdsorbElementY = true
          this.isCenterY = this.isCenterY || condition.isCenter
        } else {
          this.isHasAdsorbElementX = true
          this.isCenterX = this.isCenterX || condition.isCenter
        }
      })
    }
  }
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
  directionConditions(dragRect: DragDOMRect, anotherRect: DragDOMRect) {
    const { halfWidth: dragWidthHalf, halfHeight: dragHeightHalf } = dragRect
    const { top, height, bottom, left, width, right, halfHeight: itemHeightHalf, halfWidth: itemWidthHalf } = anotherRect
    /*
		* eg：this._isNearly(dragRect.bottom, top)
		* 如果被拖拽元素的底边与参考元素的顶边达到吸附条件时
		* 那么标线需要显示的位置就是，lineValue： 参考元素的顶部top
		* 被拖拽元素需要显示的位置就是 dragValue：参考元素的top - 拖拽元素的高度
		* 画图看更直观一些
		* */
    return {
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
          equality: height === dragRect.height,
          isCenter: true
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
          equality: width === dragRect.width,
          isCenter: true
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
  }
  hideRefLine() {
    this.isHasAdsorbElementY = false
    this.isHasAdsorbElementX = false
    this.isCenterY = false
    this.isCenterX = false
    // 隐藏所有标线
    Object.values(this.lines).forEach((item: HTMLElement) => item.hide())
    // 获取所有类名包含 ref-line-active 的元素，然后为这些元素删除 ref-line-active 这个类名
    Array.from(document.querySelectorAll('.ref-line-active')).forEach((item) => item.classList.remove('ref-line-active'))
  }
  _isNearly(dragValue, targetValue, isStrict = false) {
    return isStrict
      ? dragValue === targetValue
      : Math.abs(dragValue - targetValue) <= this.options.gap
  }
  get whetherStop() {
    return this.isHasAdsorbElementX || this.isHasAdsorbElementY && this.options.adsorbAfterStopDiff
  }
}

