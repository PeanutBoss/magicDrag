namespace StateManager {
  const EventBus = {
    trigger(...arg: any): any {},
    on(...arg: any): any {}
  }



  // MARK 1.状态管理器： 首先，我们在主库中创建一个状态管理器，用于管理元素的状态。状态管理器包含元素的位置、大小、锁定状态等信息。
  class StateManager {
    private elementStateMap
    constructor() {
      this.elementStateMap = new Map()
    }

    getElementState(element) {
      return this.elementStateMap.get(element) || {}
    }

    updateElementState(element, newState) {
      this.elementStateMap.set(element, newState)
      // 触发事件，通知插件状态更新
      EventBus.trigger('elementStateChanged', element)
    }
  }

  const stateManager = new StateManager()



  // MARK 2.插件接口规范化： 我们定义一个插件接口，规定插件需要实现的方法和属性。
  interface PluginInterface {
    init(): void
    unbind(): void
    // 其他插件方法...
  }



  // MARK 3.PositionTracker 插件： 创建一个名为 "PositionTracker" 的插件，用于追踪元素的位置，并在位置发生变化时更新状态。
  class PositionTracker implements PluginInterface {
    init() {
      EventBus.on('elementStateChanged', this.handleElementStateChanged.bind(this))
    }
    unbind() {}

    handleElementStateChanged(element) {
      const currentState = stateManager.getElementState(element)
      // 更新位置追踪逻辑，假设更新元素的位置信息到状态管理器
      const newPosition = this.trackPosition(element)
      const newState = { ...currentState, position: newPosition }
      stateManager.updateElementState(element, newState)
    }

    trackPosition(element): any {
      // 实际的位置追踪逻辑...
    }
  }



  // MARK 4.初始化插件： 在主库初始化时，加载并初始化 "PositionTracker" 插件。
  const positionTrackerPlugin = new PositionTracker()
  positionTrackerPlugin.init()

  // 初始化元素状态
  const element = document.getElementById('elementId')
  const initialElementState = { position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, locked: false }
  stateManager.updateElementState(element, initialElementState)
}
