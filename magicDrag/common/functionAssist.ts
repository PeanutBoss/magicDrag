/* functional correlation - 功能相关 */

// 轮廓点超出body不显示滚动条
export function fixContourExceed() {
  document.body.style.overflow = 'hidden'
}

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
