import { Plugin } from '../index'
import { actionMap, ActionDescribe, ActionMap } from './actionMap'
import { ClassName } from "../../style/className";

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

function processActionStatus (target, actionDomList: HTMLElement[], isLock: boolean, lockItemClassName) {
  for (const [index, action] of Object.entries(actionDomList)) {
    if (index === '0') continue // 锁定/解锁操作不需要被锁定
    if (isLock) {
      action.className += lockItemClassName
    } else {
      action.className = action.className.replaceAll(lockItemClassName, '')
    }
  }
}

export type ActionKey = 'lock' | 'blowUp' | 'reduce' | 'copy' | 'delete' | 'rotate'

export type DefaultContextMenuOptions = {
  offsetX?: number
  offsetY?: number
  lockTargetClassName?: string
  containerClassName?: string
  itemClassName?: string
  lockItemClassName?: string
}

const defaultContextMenuOptions: DefaultContextMenuOptions = {
  offsetX: 20,
  offsetY: 20,
  lockTargetClassName: ClassName.LockTargetClassName,
  containerClassName: ClassName.ContainerClassName,
  itemClassName: ClassName.ItemClassName,
  lockItemClassName: ClassName.LockItemClassName,
}

// TODO 将 executeActionCallbacks 需要执行的回调全部保存到插件中，在插件收到通知后执行所有回调
export default class ContextMenu implements Plugin {
  name
  private actions
  constructor(private actionList, private options, private stateManager) {
    this.name = 'ContextMenu'
    this.getMenuBox()
    this.bindHidden = this.hiddenMenu.bind(this)
    this.bindContextCallback = this.contextCallback.bind(this)
  }
  init() {
    const { elementParameter } = this.stateManager.currentState
    const { privateTarget } = elementParameter
    privateTarget.addEventListener('contextmenu', this.bindContextCallback)
    this.actions = new Actions(this.getActionMapByKey(this.actionList), { actionList: this.actionList, options: this.options }, this.stateManager)
  }
  unbind({ elementParameter }) {
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
    const { elementParameter: { privateTarget }, globalDataParameter: { initialTarget } } = this.stateManager.currentState
    const lockDom = this.actions.findActionDom('lock')
    lockDom && (lockDom.innerText = initialTarget.isLock ? '解锁' : '锁定')

    processActionStatus(privateTarget, menuState.actionElementList, initialTarget.isLock, this.options.lockItemClassName)
    this.showMenu(true, { left: event.pageX, top: event.pageY })
  }
  getMenuBox () {
    if (!menuState.menuBox) {
      menuState.menuBox = document.createElement('div')
      menuState.menuBox.className = this.options.containerClassName
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
  constructor(private actionMap: ActionMap, options, private stateManager) {
    this.insertAction(menuState.menuBox, options)
  }
  insertAction (menuBox: HTMLElement, options) {
    if (menuState.isInsertAction) return
    menuState.isInsertAction = true
    for (const actionKey in this.actionMap) {
      const actionData = this.actionMap[actionKey]
      actionData.getMenuContextParameter = todoBindFunc.bind(null, options)
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
    const { options: { itemClassName } } = action.getMenuContextParameter()
    actionElement.className = itemClassName
    actionElement.textContent = action.actionName
    actionElement.onclick = action.actionCallback.bind(action, this.stateManager)
    return actionElement
  }
  findActionDom (actionName) {
    return this.actionMap[actionName]?.actionDom
  }
}

function todoBindFunc (data) {
  return data
}
