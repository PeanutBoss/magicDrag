/* functional correlation - 功能相关 */

// 轮廓点超出body不显示滚动条
import { MagicDragOptions } from './magicDragAssist.ts'

export function fixContourExceed() {
  document.body.style.overflow = 'hidden'
}

// 为参考线、距离提示添加辅助方法
export function mountAssistMethod(element: HTMLElement) {
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

export function processOption(options: MagicDragOptions) {
  // pointSize的优先级高于pointStyle.width
  options.pointSize = options.pointSize || Number(options.customStyle.pointStyle.width)
  return options
}
