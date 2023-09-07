class Watcher {
  private events = {}
  constructor() {}

  on(type, callback) {
    this.getEventInfo(type).push(callback)
    return this
  }

  trigger(type, ...rest) {
    const callbacks = this.getEventInfo(type)
    if (callbacks) {
      callbacks.forEach(callback => callback(...rest))
    }
    return this
  }

  // 检查当前事件有没有已经注册回调函数，如果有返回回调队列，没有返回空数组
  getEventInfo(type) {
    if (!this.events[type]) this.events[type] = []
    return this.events[type]
  }

  remove(type, fn) {
    const callbacks = this.getEventInfo(type)
    if (!fn) {
      this.events[type] = []
    } else {
      callbacks.splice(callbacks.indexOf(fn), 1)
    }
    return this
  }
}

export default new Watcher()
