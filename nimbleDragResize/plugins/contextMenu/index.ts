import { Plugin } from '../index.ts'
import { actionMap, ActionDescribe, ActionMap } from './actionMap.ts'
import {getCurrentParameter} from '../../utils/parameter.ts'

const ContainerClassName = 'drag_resize-menu-container-new' // 菜单的类名
const ItemClassName = 'drag_resize-menu-item' // 选项的类名
const LockItemClassName = ' drag_resize-menu-item-lock' // 锁定选项的类名
const LockTargetClassName = ' drag_resize-target-lock' // 锁定目标元素的类名

export const menuState: any = {
  isInsertAction: false,
  menuBox: null,
  actionElementList: [],
  isLock: false,
  actions: null,
  currentTarget: null,
  classCopyPrefix: 'box_copy_',
  copyIndex: 0
}

function processActionStatus (target, actionDomList: HTMLElement[], isLock: boolean) {
  for (const [index, action] of Object.entries(actionDomList)) {
    if (index === '0') continue // 锁定/解锁操作不需要被锁定
    if (isLock) {
      action.className += LockItemClassName
    } else {
      action.className = action.className.replaceAll(LockItemClassName, '')
    }
  }
}

type actionKey = 'lock' | 'blowUp' | 'reduce' | 'copy' | 'delete'

export default class ContextMenu implements Plugin {
  name: 'ContextMenu'
  private actions
  constructor(private actionList: actionKey[] = Object.keys(actionMap) as actionKey[]) {
    this.getMenuBox()
    this.bindHidden = this.hiddenMenu.bind(this)
    this.bindContextCallback = this.contextCallback.bind(this)
  }
  init(elementParameter, stateParameter, globalDataParameter, options) {
    const { privateTarget } = elementParameter
    privateTarget.addEventListener('contextmenu', this.bindContextCallback)
    this.actions = new Actions(this.getActionMapByKey(this.actionList))
  }
  unbind(elementParameter, stateParameter, globalDataParameter, options) {
    const { privateTarget } = elementParameter
    privateTarget.removeEventListener('contextmenu', this.bindContextCallback)
    this.destroyMenu()
  }
  getActionMapByKey (keyList) {
    const actions = {}
    for (const key of keyList) {
      actions[key] = actionMap[key]
    }
    return actions
  }
  contextCallback (event) {
    event.preventDefault()
    const { elementParameter: { privateTarget }, globalDataParameter: { initialTarget } } = getCurrentParameter()
    const lockDom = this.actions.findActionDom('lock')
    lockDom?.innerText = initialTarget.isLock ? '解锁' : '锁定'

    processActionStatus(privateTarget, menuState.actionElementList, initialTarget.isLock)
    this.showMenu(true, { left: event.pageX, top: event.pageY })
  }
  getMenuBox () {
    if (!menuState.menuBox) {
      menuState.menuBox = document.createElement('div')
      menuState.menuBox.className = ContainerClassName
      document.body.append(menuState.menuBox)
    }
    return menuState.menuBox
  }
  showMenu (isShow, position: any = {}) {
    const { left = 0, top = 0 } = position
    menuState.menuBox.style.left = left + 'px'
    menuState.menuBox.style.top = top + 'px'
    menuState.menuBox && (menuState.menuBox.style.display = isShow ? 'block' : 'none')

    isShow && window.addEventListener('click', this.bindHidden)
  }
  hiddenMenu () {
    window.removeEventListener('click', this.bindHidden)
    this.showMenu(false)
  }
  destroyMenu () {
    menuState.menuBox.remove()
    menuState.menuBox = null
  }
  bindHidden: null
  bindContextCallback: null
}

class Actions {
  constructor(private actionMap: ActionMap) {
    this.insertAction(menuState.menuBox)
  }
  insertAction (menuBox: HTMLElement) {
    if (menuState.isInsertAction) return
    menuState.isInsertAction = true
    for (const actionKey in this.actionMap) {
      const actionData = this.actionMap[actionKey]
      menuState.actionElementList.push(
        actionData.actionDom = this.getActionDom(this.actionMap[actionKey].actionName, actionData)
      )
    }
    menuBox.append(...menuState.actionElementList)
  }
  getActionDom (ele: HTMLElement | string, action: ActionDescribe): HTMLElement {
    if (ele instanceof HTMLElement) {
      ele.onclick = action.actionCallback.bind(action)
      return ele
    }

    let actionElement = document.createElement('div')
    actionElement.className = ItemClassName
    actionElement.textContent = action.actionName
    actionElement.onclick = action.actionCallback.bind(action)
    return actionElement
  }
  findActionDom (actionName) {
    return this.actionMap[actionName]?.actionDom
  }
}
