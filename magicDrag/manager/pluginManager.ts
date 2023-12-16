export default class PluginManager {
  private _plugins: Map<string, Plugin> = new Map()
  get plugins() {
    return new Map(this._plugins)
  }

  registerPlugin(name: string, plugin: Plugin) {
    this._plugins.set(name, plugin)
  }

  installPlugin() {
    this.plugins.forEach(plugin => {
      plugin.init()
    })
  }

  uninstallPlugin() {
    this.plugins.forEach(plugin => {
      plugin.unbind()
    })
  }

  // MARK 5.扩展点触发 - 在关键时刻触发扩展点，通知注册在该扩展点上的插件。
  callExtensionPoint(extensionPoint: Exclude<keyof Plugin, 'name'>, ...args: any[]) {
    this.plugins.forEach((plugin) => {
      if (typeof plugin[extensionPoint] === 'function') {
        plugin[extensionPoint](...args)
      }
    })
  }
}

export interface Plugin {
  name: string
  init: () => void
  unbind: () => void
  drag?: (...args: any[]) => void
  dragStart?: (...args: any[]) => void
  dragEnd?: (...args: any[]) => void
  resize?: (...args: any[]) => void
  targetPressChange?: (...args: any[]) => void
  pointPressChange?: (...args: any[]) => void
}
/*
* MARK 当设计插件机制时，可以遵循以下一般的工作流程：
   定义接口或基类： 首先，你需要定义一个接口或基类，用于规定插件应该实现的方法或属性。这可以帮助确保插件遵循相同的结构和约定。
   实现插件类： 创建实际的插件类，这些类应该继承自定义的接口或基类。插件类会包含特定的功能、操作或扩展。
   注册插件： 在你的拖拽库中，你需要一个地方来注册插件。这可以是一个插件管理器或主类。在这里，你会实例化并管理所有的插件。
   初始化插件： 在拖拽库初始化或启动时，你需要初始化所有已注册的插件。这可以通过调用插件的初始化方法来完成。
   调用插件功能： 在适当的时候，你会调用已初始化的插件的特定方法，以实现额外的功能。这些方法可能在拖拽、缩放、点击等操作发生时被调用。
   传递参数： 在调用插件的方法时，通常会将一些参数传递给插件。这些参数可以是关于拖拽元素、状态、位置等的信息，以便插件可以根据需要执行操作。
   响应插件操作： 插件会执行其自身的逻辑，可能会修改拖拽元素的状态、位置或其他属性。
   销毁插件： 在拖拽库的生命周期结束时，需要销毁所有已初始化的插件，以释放资源并执行必要的清理操作。
   总的来说，插件机制的核心思想是将拖拽库的功能划分为模块化的插件，以便于灵活扩展和定制。每个插件负责一项特定的任务，
   而库本身负责管理插件的初始化、调用和销毁。这种模式可以帮助保持库的可维护性和可扩展性，使新功能的添加更加简便。
* */
