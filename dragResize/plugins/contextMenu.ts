import { updatePointPosition } from '../../utils/dragResize.ts'
import useDragResize from "../useDragResize.ts";
import { Plugin } from '../plugins/index.ts'

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
const lockMap: Map<HTMLElement, boolean> = new Map()
const lockActionMap: Map<HTMLElement, HTMLElement[]> = new Map()

/*
* TODO 右击菜单元素复用的问题，主要问题在于独立目标元素的状态信息
* */
class ContextMenu implements Plugin {
  name: 'ContextMenu'
  private isInsert = false
  private menuBox
  private actions: Actions
  constructor(private actionList: Array<string>) {
    this.menuBox = this.getMenuBox()

    this.bindContextCallback = this.contextCallback.bind(this)
  }
  init ({ target, pointElements }, payload) {
    this.actions = new Actions(this.actionList, this.menuBox, { state: payload, domInfo: { target, pointElements } })
    lockActionMap.set(target, this.actions.actionElementList)
    this.bindHidden = this.hidden.bind(this, this.actions)
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

function getScaleSize (originSize, ratio) {
  return {
    x: originSize.width * ratio,
    y: originSize.height * ratio
  }
}

interface ActionState {
  state: {
    targetState: any
    initialTarget: any
    pointState: any
  },
  domInfo: {
    target: HTMLElement
    pointElements: { [key: string]: HTMLElement }
    container: HTMLElement
  }
}
interface ActionDescribe {
  name: string
  actionDom: HTMLElement | null
  actionName: string
  actionCallback (state: ActionState, event): void
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
  [key: string]: any
}
interface ActionMap {
  [key: string]: ActionDescribe
}

// MARK callbacks如果要终止执行，必须显式的返回false
const actionMap: ActionMap = {
  lock: {
    name: 'lock',
    actionName: '锁定',
    actionDom: null,
    actionCallback: function ({ state, domInfo }, event) {
      // 没有则说明这个元素现在是未锁定状态
      const isLock = lockMap.get(menuState.currentTarget) ?? false
      state.targetState.isLock = !isLock
      lockMap.set(menuState.currentTarget, !isLock)
      lockCallback(menuState.currentTarget, lockActionMap.get(domInfo.target), !isLock)
    },
    dragCallbacks: {
      beforeCallback(targetState) {
        return !targetState.isLock
      },
      afterCallback(targetState): boolean {
        return true
      }
    },
    resizeCallbacks: {},
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
    actionCallback({ state: { targetState, pointState, initialTarget }, domInfo: { target, pointElements } }, event) {
      if (targetState.isLock) return

      const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

      targetState.width += scaleSize.x
      targetState.height += scaleSize.y
      target.style.width = targetState.width + 'px'
      target.style.height = targetState.height + 'px'
      updatePointPosition(
        target,
        { direction: 'rb', movementX: { value: scaleSize.x }, movementY: { value: scaleSize.y } },
        { initialTarget, pointElements, pointSize: 10, pointState },
        false
      )
      initialTarget.width += scaleSize.x
      initialTarget.height += scaleSize.y
    }
  },
  reduce: {
    name: 'reduce',
    actionName: '缩小',
    actionDom: null,
    actionCallback({ state: { targetState, pointState, initialTarget }, domInfo: { target, pointElements } }, event) {
      if (targetState.isLock) return

      const scaleSize = getScaleSize({ width: initialTarget.originWidth, height: initialTarget.originHeight }, 0.1)

      targetState.width -= scaleSize.x
      targetState.height -= scaleSize.y
      target.style.width = targetState.width + 'px'
      target.style.height = targetState.height + 'px'
      updatePointPosition(
        target,
        { direction: 'rb', movementX: { value: -scaleSize.x }, movementY: { value: -scaleSize.y } },
        { initialTarget, pointElements, pointSize: 10, pointState },
        false
      )
      initialTarget.width -= scaleSize.x
      initialTarget.height -= scaleSize.y
    }
  },
  copy: {
    name: 'copy',
    actionName: '复制',
    actionDom: null,
    actionCallback({ state, domInfo }, event) {
      if (state.targetState.isLock) return

      const { target, container } = domInfo
      const { initialTarget } = state
      const parent = target.parentNode
      const copyTarget = target.cloneNode() as HTMLElement
      const newClassName = menuState.classCopyPrefix + menuState.copyIndex++
      copyTarget.className = newClassName
      copyTarget.style.width = target.offsetWidth + 'px'
      copyTarget.style.height = target.offsetHeight + 'px'
      copyTarget.style.left = initialTarget.left + 20 + 'px'
      copyTarget.style.top = initialTarget.top + 20 + 'px'
      parent.appendChild(copyTarget)
      useDragResize(`.${newClassName}`, { containerSelector: '.wrap' }, [new ContextMenu(Object.keys(actionMap))])
    }
  },
  delete: {
    name: 'delete',
    actionName: '删除',
    actionDom: null,
    actionCallback({ state, domInfo }, event) {
      if (state.targetState.isLock) return

      const { target } = domInfo
      target.remove()
    }
  }
}

function lockCallback (target, actionDoms: HTMLElement[], isLock: boolean) {
  for (const [index, action] of Object.entries(actionDoms)) {
    if (index === '0') continue
    if (isLock) {
      action.className += LockItemClassName
      target.className += LockTargetClassName
    } else {
      action.className = action.className.replace(LockItemClassName, '')
      target.className = target.className.replace(LockTargetClassName, '')
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

class Actions {
  public actionElementList: HTMLElement[] = []
  private actionMap: ActionMap
  constructor(actionList: string[], actionContainer: HTMLElement, private pluginData: any) {
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
      ele.onclick = action.actionCallback.bind(action, this.pluginData)
      return ele
    }

    let actionElement = document.createElement('div')
    actionElement.className = ItemClassName
    actionElement.textContent = action.actionName
    actionElement.onclick = action.actionCallback.bind(action, this.pluginData)
    return actionElement
  }
}

export default new ContextMenu(Object.keys(actionMap))
