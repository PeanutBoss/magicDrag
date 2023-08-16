let lines = {
  xt: null,
  xc: null,
  xb: null,
  yl: null,
  yc: null,
  yr: null,
}

// 置入参考线
for (let p in lines) {
  let node = lines[p] = document.createElement('div')

  node.classList.add('ref-line', p)
  // 以x/y开头，说明是与x/y轴平行的线
  node.style.cssText = `display:none;opacity:0.7;position:absolute;background:#4DAEFF;z-index:199111250;
    ${p[0] === 'x' ? 'width:100%;height:1px;left:0;' : 'width:1px;height:100%;top:0;'}`

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

export class RefLine {
  private isHasAdsorbElement
  constructor(private options: any = {}) {
    this.options = Object.assign({
      gap: 3, // 吸附的距离范围
      adsorbAfterStopDiff: true, // 同一轮对比中，如果某一个元素达到吸附条件，是否停止与剩余元素的对比操作，默认为false
    }, options)
    this.isHasAdsorbElement = false
  }

  /**
   * @param dragNode {Element} 拖拽元素的原生node
   * @param checkNodes {String|Element} 选择器 或者 原生node集合
   */
  check(dragNode, checkNodes) {
    // 获取 nodeList MARK nodeList应该是要对比的其他元素
    checkNodes = typeof checkNodes === 'string' ? document.querySelectorAll(checkNodes) : checkNodes
    // 获取被拖拽元素相对视口的位置
    let dragRect = dragNode.getBoundingClientRect()

    // 隐藏所有标线
    this.uncheck()

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
            lineNode: lines.xt, // 对应的真实DOM
            lineValue: top, // x轴上面那条线的的top（相对视口顶部的距离）
            dragValue: top
          },
          // xt-bottom 被拖拽元素的底边与参考元素的顶边达到吸附条件
          {
            isNearly: this._isNearly(dragRect.bottom, top),
            lineNode: lines.xt,
            lineValue: top, // x轴上面那条线的的top
            dragValue: top - dragRect.height
          },
          // xc 被拖拽元素的x轴中心与参考元素的x轴中心达到吸附条件
          {
            isNearly: this._isNearly(dragRect.top + dragHeightHalf, top + itemHeightHalf),
            lineNode: lines.xc,
            lineValue: top + itemHeightHalf,
            dragValue: top + itemHeightHalf - dragHeightHalf // 如果这个值 <= gap，说明达到吸附条件
          },
          // xb-bottom 被拖拽元素的底边与参考元素的底边达到吸附条件
          {
            isNearly: this._isNearly(dragRect.bottom, bottom),
            lineNode: lines.xb,
            lineValue: bottom,
            dragValue: bottom - dragRect.height
          },
          // xb-top 被拖拽元素的顶边与参考元素的底边达到吸附条件
          {
            isNearly: this._isNearly(dragRect.top, bottom),
            lineNode: lines.xb,
            lineValue: bottom,
            dragValue: bottom
          }
        ],

        left: [
          // yl-left
          {
            isNearly: this._isNearly(dragRect.left, left),
            lineNode: lines.yl,
            lineValue: left,
            dragValue: left
          },
          // yl-right
          {
            isNearly: this._isNearly(dragRect.right, left),
            lineNode: lines.yl,
            lineValue: left,
            dragValue: left - dragRect.width
          },
          // yc
          {
            isNearly: this._isNearly(dragRect.left + dragWidthHalf, left + itemWidthHalf),
            lineNode: lines.yc,
            lineValue: left + itemWidthHalf,
            dragValue: left + itemWidthHalf - dragWidthHalf
          },
          // yr-left
          {
            isNearly: this._isNearly(dragRect.right, right),
            lineNode: lines.yr,
            lineValue: right,
            dragValue: right - dragRect.width
          },
          // yr-right
          {
            isNearly: this._isNearly(dragRect.left, right),
            lineNode: lines.yr,
            lineValue: right,
            dragValue: right
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
          dragNode.style[key] = `${condition.dragValue}px`
          // 设置线的位置（top/left）
          condition.lineNode.style[key] = `${condition.lineValue}px`
          // 显示达到吸附条件的线
          condition.lineNode.show()
        })
      }
    })
  }

  uncheck() {
    this.isHasAdsorbElement = false
    // 隐藏所有标线
    Object.values(lines).forEach((item) => item.hide())
    // 获取所有类名包含 ref-line-active 的元素，然后为这些元素删除 ref-line-active 这个类名
    Array.from(document.querySelectorAll('.ref-line-active')).forEach((item) => item.classList.remove('ref-line-active'))
  }

  _isNearly(dragValue, targetValue) {
    return Math.abs(dragValue - targetValue) <= this.options.gap
  }
}

// module.exports = RefLine

/*
* KNOW 该方法返回的 DOMRect 对象中的 width 和 height 属性是包含了 padding 和 border-width 的，而不仅仅是内容部分的宽度和高度。
*   在标准盒子模型中，这两个属性值分别与元素的 width/height + padding + border-width 相等。
*   而如果是 box-sizing: border-box，两个属性则直接与元素的 width 或 height 相等。
* */

/*
* MARK 如果两个参考元素紧挨着的时候，拖拽元素与第一个参考元素达到吸附条件且执行了吸附操作
*  但遍历还没有结束，当与第二个参考元素对比时，第二个元素也有一条边与拖拽元素一条边对齐
*  这时也需要执行吸附操作（因为两个参考元素是紧挨着的，所以移动操作执行后拖拽元素的位置并没有变化）
*  最后还需要更新标线的位置，比如question文件夹下的图refLineError ：吸附条件满足 conditions.top[1]
*  解决方法：如果跟某一个元素对比达成吸附条件，则不跟其他元素对比了
* */

/*
* FIXME 新增问题，如果一个元素执行过吸附就停止对比：
*  问题：第一个元素x轴对齐，第二个元素y轴达成吸附条件的时候不显示y轴了，因为没有跟第二个元素对比
*  优化点：第一个元素x轴一条边达到吸附条件，第二个元素x轴三条边达到吸附条件，应该哪个元素达到吸附条件的
*  边比较多，显示哪个元素的标线
* */
