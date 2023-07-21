const ContainerClassName = 'drag_resize-menu-container'
const ItemClassName = 'drag_resize-menu-item'

interface ActionDescribe {
  name?: string
  actionDom: HTMLElement | null
  actionName: string
  actionCallback (state, event): void
  // 最好显式的返回一个布尔值
  dragCallbacks?: {
    beforeCallback? (targetState): boolean
    afterCallback? (targetState): boolean
  },
  resizeCallbacks?: {
    beforeCallback? (targetState): boolean
    afterCallback? (targetState): boolean
  },
  mousedownCallbacks?: {
    beforeCallback? (targetState): boolean
    afterCallback? (targetState): boolean
  }
}
interface ActionMap {
  [key: string]: ActionDescribe
}

const actionMap: ActionMap = {
  lock: {
    name: 'lock',
    actionName: '锁定',
    actionDom: null,
    actionCallback: function ({ targetState }, event) {
      targetState.isLock = !targetState.isLock
      this.actionDom.innerText = targetState.isLock ? '解锁' : '锁定'
    },
    dragCallbacks: {
      beforeCallback(targetState) {
        return !targetState.isLock
      },
      afterCallback(targetState): boolean {
        return true
      }
    },
    resizeCallbacks: {
      beforeCallback(targetState) {
        return !targetState.isLock
      }
    },
    mousedownCallbacks: {
      beforeCallback(targetState) {
        return !targetState.isLock
      }
    }
  },
  blowUp: {
    name: 'blowUp',
    actionName: '放大',
    actionDom: null,
    actionCallback(state, event) {
      console.log('放大')
    },
    dragCallbacks: {
      beforeCallback(targetState): boolean {
        return true
      }
    }
  }
}

interface ActionData {
  name: string
  actions: {
    beforeCallback?(targetState): boolean
    afterCallback?(targetState): boolean
  }
}
export function getActionCallbacks (type: 'dragCallbacks' | 'resizeCallbacks' | 'mousedownCallbacks'): ActionData[] {
  const actions = []
  for (const [key, describe]  of Object.entries(actionMap)) {
    actions.push({
      name: describe.name,
      actions: describe[type]
    })
  }
  return actions
}

export function executeActionCallbacks (actionData: ActionData[], targetState, type: 'beforeCallback' | 'afterCallback') {
  let isContinue = true
  try {
    for (let i = 0; i < actionData.length; i++) {
      const data = actionData[i]
      // 获取回调执行结果，如果没有返回值则默认为true
      isContinue = data?.actions?.[type]?.(targetState) ?? true
      // 如果某个回调返回false，则终止执行其他回调
      if (isContinue === false) break
    }
  } catch (e) {
    console.log(e, '----错误---')
    return false
  }
  return isContinue
}

class ContextMenu {
  name: 'ContextMenu'
  private isInsert = false
  private menuBox
  private actions: Actions
  private state: any
  constructor(private actionList: Array<string>) {
    this.menuBox = this.getMenuBox()

    this.bindContextCallback = this.contextCallback.bind(this)
    this.bindHidden = this.hidden.bind(this)
  }
  init (target: HTMLElement, targetState) {
    this.state = targetState
    this.actions = new Actions(this.actionList, this.menuBox, this.state)
    target.addEventListener('contextmenu', this.bindContextCallback)
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

  hidden (event) {
    // if (![...this.actions.actionElementList].includes(event.target)) {
      this.showMenu(false)
    // }
  }
  contextCallback (event) {
    event.preventDefault()
    this.showMenu(true, { left: event.pageX, top: event.pageY })
  }
  bindHidden: null
  bindContextCallback: null
}

class Actions {
  public actionElementList: HTMLElement[] = []
  private actionMap: ActionMap
  constructor(actionList: string[], actionContainer: HTMLElement, private state: any) {
    this.actionMap = this.getMapByActionList(actionList)
    this.insertAction(actionContainer)
  }
  getMapByActionList (actionList: string[]): ActionMap {
    const map = {}
    const mapKeys = Object.keys(actionMap)
    mapKeys.forEach(key => {
      if (actionList.includes(key)) {
        map[key] = actionMap[key]
      }
    })
    return map
  }
  insertAction (menuBox: HTMLElement) {
    for (const actionKey in this.actionMap) {
      const actionData = this.actionMap[actionKey]
      this.actionElementList.push(
        actionData.actionDom = this.getActionDom(this.actionMap[actionKey].actionName, actionData)
      )
    }
    menuBox.append(...this.actionElementList)
  }
  getActionDom (ele: HTMLElement | string, action: ActionDescribe): HTMLElement {
    if (ele instanceof HTMLElement) {
      ele.onclick = action.actionCallback.bind(action, this.state)
      return ele
    }

    let actionElement = document.createElement('div')
    actionElement.className = ItemClassName
    actionElement.textContent = action.actionName
    actionElement.onclick = action.actionCallback.bind(action, this.state)
    return actionElement
  }
}

export default new ContextMenu(Object.keys(actionMap))

