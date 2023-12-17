declare global {
  interface EventTarget {
    priorityAddEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions & { priority?: number }): void
    priorityRemoveEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  }
}

export default function insertCustomMethod() {
  EventTarget.prototype.priorityAddEventListener = function (type, listener, options) {
    // 存储优先级信息，如果之前没有存储过，则初始化为一个空数组
    if (!this._eventListeners) this._eventListeners = {}
    if (!this._bindEvents) this._bindEvents = {}
    // 如果注册这个类型的事件
    if (!this._eventListeners[type]) {
      const bindEvent = event => {
        console.log(111)
        this._eventListeners[type] = this._eventListeners[type].sort((a, b) => b.priority - a.priority)
        this._eventListeners[type].forEach(item => item.listener(event))
      }
      // 初始化
      this._eventListeners[type] = []
      this._bindEvents[type] = bindEvent
      // 注册（priority越大执行的优先级越高）
      window.addEventListener(type, bindEvent)
    }
    // 添加回调队列
    if (this._eventListeners[type]) this._eventListeners[type].push({ priority: options?.priority || 0, listener })
  }

  EventTarget.prototype.priorityRemoveEventListener = function (type, listener) {
    if (!this._eventListeners || !this._eventListeners[type]) return
    const needDelIndex = this._eventListeners[type].findIndex(item => item.listener === listener)
    this._eventListeners[type].splice(needDelIndex, 1)
    if (this._eventListeners[type].length === 0) this._eventListeners[type] = null
    if (Object.keys(this._eventListeners).length === 0) this._eventListeners = null
  }
}

