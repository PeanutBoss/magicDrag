import { Plugin } from '../functions'
import { nextTick } from '@vue/runtime-core'
import {getElement, numberToStringSize, setStyle} from '../utils/tools'

/*
* 获取容器元素可以在按下鼠标的时候获取，这个时候DOM必然已经插入完毕
* */

class RegionalSelection implements Plugin {
  name: string
  private regionalEl = null
  private startCoordinate = { x: 0, y: 0 }
  private isPress = false
  constructor(private container: string | HTMLElement) {
    this.name = 'regionalSelection'
    this.bindMouseDown = this._mousedown.bind(this)
    this.bindMouseMove = this._mouseMove.bind(this)
    this.bindMouseUp = this._mouseup.bind(this)
  }
  init() {
    nextTick(this.readyContainer.bind(this))
  }
  unbind() {
    this.container = null
    window.removeEventListener('mousedown', this.bindMouseDown)
    window.removeEventListener('mousemove', this.bindMouseMove)
    window.removeEventListener('mouseup', this.bindMouseUp)
  }
  readyContainer() {
    this.container = getElement(this.container)
    window.addEventListener('mousedown', this.bindMouseDown)
    window.addEventListener('mousemove', this.bindMouseMove)
    window.addEventListener('mouseup', this.bindMouseUp)
  }
  _mousedown(event) {
    if (event.target !== this.container) return
    this.isPress = true
    if (!this.regionalEl) this.regionalEl = document.createElement('div')
    this.startCoordinate.x = event.pageX
    this.startCoordinate.y = event.pageY
    const regionalStyle = {
      position: 'absolute',
      border: '1px solid aqua',
      width: '0',
      height: '0',
      display: 'block'
    }
    setStyle(this.regionalEl, regionalStyle)
    document.body.appendChild(this.regionalEl)
  }
  _mouseup() {
    if (!this.isPress) return
    this.isPress = false
    this.regionalEl.style.display = 'none'
  }
  _mouseMove(event) {
    if (!this.isPress) return
    const offsetX = event.pageX - this.startCoordinate.x
    const offsetY = event.pageY - this.startCoordinate.y
    const regionalStyle = {
      width: Math.abs(offsetX),
      height: Math.abs(offsetY),
      left: offsetX < 0 ? this.startCoordinate.x + offsetX : this.startCoordinate.x,
      top: offsetY < 0 ? this.startCoordinate.y + offsetY : this.startCoordinate.y
    }
    setStyle(this.regionalEl, 'display', 'block')
    setStyle(this.regionalEl, numberToStringSize(regionalStyle))
  }
  containList(elList: HTMLElement[]) {
    const regionalRect = this.regionalEl.getBoundingClientRect()
    return elList.map(m => m.getBoundingClientRect())
      .filter(rect => this._isContains(rect, regionalRect))
  }
  _isContains(rect, referRect) {
    return rect.left > referRect.left
      && rect.top > referRect.top
      && rect.right < referRect.right
      && rect.bottom < referRect.bottom
  }

  bindMouseDown
  bindMouseUp
  bindMouseMove
}

export default RegionalSelection
