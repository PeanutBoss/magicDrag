import { Plugin, StateManager } from '../manager'
import { getElement, numberToStringSize, setStyle } from '../utils/tools'
import { useSpecialKey } from './shortcut'

const { ctrlIsPress } = useSpecialKey()

/*
* 获取容器元素可以在按下鼠标的时候获取，这个时候DOM必然已经插入完毕
* */

class RegionalSelection implements Plugin {
  name: string
  private regionalEl = null
  private startCoordinate = { x: 0, y: 0 }
  private isPress = false
  private containerEl
  constructor(private containerSelector: string, private stateManager: StateManager) {
    this.name = 'regionalSelection'
    this.bindMouseDown = this._mousedown.bind(this)
    this.bindMouseMove = this._mouseMove.bind(this)
    this.bindMouseUp = this._mouseup.bind(this)
    this.bindClickSelection = this._clickSelection.bind(this)
  }
  init() {
    window.addEventListener('mousedown', this.bindMouseDown)
    window.addEventListener('mousemove', this.bindMouseMove)
    window.addEventListener('mouseup', this.bindMouseUp)
  }
  unbind() {
    window.removeEventListener('mousedown', this.bindMouseDown)
    window.removeEventListener('mousemove', this.bindMouseMove)
    window.removeEventListener('mouseup', this.bindMouseUp)
    this.containerEl?.removeEventListener('click', this.bindClickSelection)
    this.containerSelector = null
    this.containerEl = null
  }
  dragStart({ privateTarget }) {
    if (isSelectedEl(this)) {
      this.resetStateAndStyle()
    }
    function isSelectedEl(context) {
      return context.stateManager.getStateByEle(privateTarget).regionSelected
    }
  }
  getContainer() {
    if (this.containerEl) return this.containerEl
    this.containerEl = getElement(this.containerSelector)
    // 添加点击多选
    this.containerEl.addEventListener('click', this.bindClickSelection)
    return this.containerEl
  }
  _mousedown(event) {
    // 保证已经获取到了容器元素
    this.getContainer()
    if (event.target !== this.containerEl) return
    this.isPress = true
    // 确保已经创建了选择框
    if (!this.regionalEl) {
      this.regionalEl = document.createElement('div')
      this.regionalEl.classList.add('regional-selection')
      document.body.appendChild(this.regionalEl)
    }

    // 计算并设置元素样式
    this.startCoordinate.x = event.pageX
    this.startCoordinate.y = event.pageY
    const regionalStyle = {
      position: 'absolute',
      border: '1px solid aqua',
      zIndex: '88888',
      backgroundColor: 'rgba(0, 255, 255, 0.1)'
    }
    setStyle(this.regionalEl, regionalStyle)

    // 重置选中元素的状态和样式
    this.resetStateAndStyle()
  }
  _mouseup() {
    if (!this.isPress) return
    this.isPress = false
    this.regionalEl.style.display = 'none'
  }
  _mouseMove(event) {
    if (!this.isPress) return
    const _this = this

    // 先重置所有元素的选中标识和样式
    this.resetStateAndStyle()
    // 为选中的元素添加选中样式
    updateRegionStyle()
    // 被选中的元素列表
    const selectedEls = this.containList(this.stateManager.allElement).map(m => m.el)
    // 更新选中元素的状态和样式
    changeSelected(selectedEls)

    function updateRegionStyle() {
      const offsetX = event.pageX - _this.startCoordinate.x
      const offsetY = event.pageY - _this.startCoordinate.y
      const regionalStyle = {
        width: Math.abs(offsetX),
        height: Math.abs(offsetY),
        left: offsetX < 0 ? _this.startCoordinate.x + offsetX : _this.startCoordinate.x,
        top: offsetY < 0 ? _this.startCoordinate.y + offsetY : _this.startCoordinate.y
      }
      setStyle(_this.regionalEl, 'display', 'block')
      setStyle(_this.regionalEl, numberToStringSize(regionalStyle))
    }
    function changeSelected(elementList: HTMLElement[]) {
      selectedEls.forEach(el => _this.setSelected(el, true))
    }
  }
  _clickSelection(e) {
    // 没有按下ctrl
    if (!ctrlIsPress.value) return
    // 点击的不是拖拽元素
    if (e.target === this.containerEl) return
    if (this.stateManager.allElement.includes(e.target)) this.setSelected(e.target, true)
  }
  resetStateAndStyle() {
    this.stateManager.allElement.forEach(el => this.setSelected(el, false))
  }
  setSelected(el: HTMLElement, isSelected: boolean) {
    setStyle(el, 'outline', isSelected ? '1px solid black' : 'none')
    this.stateManager.setStateByEle(el, 'regionSelected', isSelected)
  }
  containList(elList: HTMLElement[]) {
    const regionalRect = this.regionalEl.getBoundingClientRect()
    return elList.map(m => Object.assign(m.getBoundingClientRect(), { el: m }))
      .filter(rect => this._isContains(rect, regionalRect))
  }
  _isContains(rect, referRect) {
    return rect.left >= referRect.left
      && rect.top >= referRect.top
      && rect.right <= referRect.right
      && rect.bottom <= referRect.bottom
  }

  bindClickSelection
  bindMouseDown
  bindMouseUp
  bindMouseMove
}

export default RegionalSelection
