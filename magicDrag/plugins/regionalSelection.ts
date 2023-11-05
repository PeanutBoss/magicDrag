import { Plugin } from '../functions'
import { nextTick } from '@vue/runtime-core'
import { getElement } from '../utils/tools'

/*
* 获取容器元素可以在按下鼠标的时候获取，这个时候DOM必然已经插入完毕
* */

class RegionalSelection implements Plugin {
  name: string
  constructor(private container: string | HTMLElement) {
    this.name = 'regionalSelection'
    this.bindMouseDown = this._mousedown.bind(this)
    this.bindMouseUp = this._mouseup.bind(this)
  }
  init() {
    nextTick(this.readyContainer.bind(this))
  }
  unbind() {}
  readyContainer() {
    this.container = getElement(this.container)
    window.addEventListener('mousedown', this.bindMouseDown)
    window.addEventListener('mousemove', this.bindMouseMove)
    window.addEventListener('mouseup', this.bindMouseUp)
  }
  _mousedown(event) {
    if (event.target !== this.container) return
    const wrapEl = document.createElement('div')
    wrapEl.style.position = 'absolute'
    wrapEl.style.top = event.pageY + 'px'
    wrapEl.style.left = event.pageX + 'px'
    wrapEl.style.border = '1px solid aqua'
    document.body.appendChild(wrapEl)
  }
  _mouseup() {}
  _mouseMove(event) {}
  bindMouseDown
  bindMouseUp
  bindMouseMove
}

export default RegionalSelection
