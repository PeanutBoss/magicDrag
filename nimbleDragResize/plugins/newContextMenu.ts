import { updatePointPosition } from '../utils/dragResize.ts'
import useDragResize from "../useDragResize.ts";
import { Plugin } from '../plugins/index.ts'
import { Ref } from "vue";
import { getParameter } from '../utils/parameter.ts'

const ContainerClassName = 'drag_resize-menu-container'
const ItemClassName = 'drag_resize-menu-item'
const LockItemClassName = ' drag_resize-menu-item-lock'
const LockTargetClassName = ' drag_resize-target-lock'

// TODO 1.锁定状态 2.zIndex从movePoint更新 3.复制元素的类名
const menuState = {
  isLock: false,
  actions: null,
  currentTarget: null,
  classCopyPrefix: 'box_copy_',
  copyIndex: 0
}

/*
* TODO 右击菜单元素复用的问题，主要问题在于独立目标元素的状态信息
* */
class ContextMenu implements Plugin {
  name: 'ContextMenu'
  private isInsert = false
  private menuBox
  constructor(private actionList: Array<string>) {
    this.menuBox = this.getMenuBox()

    this.bindContextCallback = this.contextCallback.bind(this)
  }
  // elementParameter, stateParameter, globalDataParameter, options
  init (index) {
    const parameter = getParameter(index)
    parameter.elementParameter.target.value
  }
  unbind (target: HTMLElement) {
    target.removeEventListener('contextmenu', this.bindContextCallback)
    window.removeEventListener('click', this.bindHidden)
    this.destroyMenu()
  }

  showMenu (isShow, position: any = {}) {
    const { left = 0, top = 0 } = position
    this.menuBox.style.left = left + 'px'
    this.menuBox.style.top = top + 'px'
    this.menuBox && (this.menuBox.style.display = isShow ? 'block' : 'none')

    if (!this.isInsert) {
      window.addEventListener('click', this.bindHidden)
    }
  }
  getMenuBox () {
    if (!this.menuBox) {
      this.menuBox = document.createElement('div')
      this.menuBox.className = ContainerClassName
      document.body.append(this.menuBox)
    }
    return this.menuBox
  }
  destroyMenu () {
    this.menuBox.remove()
    this.menuBox = null
  }

  hidden (actions, event) {
    const excludeLockDom = actions.actionElementList.slice(1)
    if (excludeLockDom.includes(event.target) && actions.pluginData.state.targetState.isLock) return
    this.showMenu(false)
  }
  contextCallback (event) {
    event.preventDefault()
    menuState.currentTarget = event.target ?? false
    this.menuBox.children[0].innerText = lockMap.get(event.target) ? '解锁' : '锁定'
    this.showMenu(true, { left: event.pageX, top: event.pageY })
  }
  bindHidden: null
  bindContextCallback: null
}
