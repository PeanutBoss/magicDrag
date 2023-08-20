namespace SupportKeymap {
  // MARK 快捷键插件
  class ShortcutSupportPlugin {
    private shortcuts: Record<string, Array<{ action: () => void, priority: number }>> = {}

    // 注册快捷键操作
    registerShortcut(shortcut: string, action: () => void, options: { priority?: number } = {}): void {
      const { priority = 0 } = options
      if (!this.shortcuts[shortcut]) {
        this.shortcuts[shortcut] = []
      }
      this.shortcuts[shortcut].push({ action, priority })
      this.shortcuts[shortcut].sort((a, b) => b.priority - a.priority)
    }

    // 触发快捷键操作
    handleShortcut(event: KeyboardEvent): void {
      const shortcut = this.getShortcutFromEvent(event)
      if (this.shortcuts[shortcut]) {
        this.shortcuts[shortcut].forEach(({ action }) => action())
      }
    }

    // 获取键盘事件的快捷键表示
    getShortcutFromEvent(event: KeyboardEvent): string {
      const keys: string[] = []
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      keys.push(event.key.toUpperCase())
      return keys.join('+')
    }
  }
  // 监听键盘事件，触发快捷键操作
  document.addEventListener('keydown', event => {
    shortcutPlugin.handleShortcut(event)
  })



  // MARK 1.注册快捷键操作
  const shortcutPlugin = new ShortcutSupportPlugin()
  shortcutPlugin.registerShortcut('Ctrl+C', () => {
    // 执行复制操作
  })

  shortcutPlugin.registerShortcut('Ctrl+V', () => {
    // 执行粘贴操作
  })



  // MARK 2.快捷键冲突处理：如果多个插件注册了相同的快捷键，插件系统需要处理冲突。可以通过优先级来确定哪个插件的操作优先触发。
  shortcutPlugin.registerShortcut('Ctrl+S', () => {
    // 保存操作
  }, { priority: 1 })

  otherPlugin.registerShortcut('Ctrl+S', () => {
    // 其他操作
  }, { priority: 2 })



  // MARK 3.自定义快捷键映射：用户可以自定义快捷键映射，将快捷键绑定到特定的操作。
  shortcutPlugin.registerShortcut('Ctrl+Z', () => {
    // 撤销操作
  })

  shortcutPlugin.registerShortcut('Ctrl+Shift+Z', () => {
    // 重做操作
  })



  // MARK 4.默认快捷键映射：为一些常见操作提供默认的快捷键映射，让用户无需手动注册。
  shortcutPlugin.registerShortcut('Ctrl+X', () => {
    // 剪切操作
  })

  shortcutPlugin.registerShortcut('Ctrl+Y', () => {
    // 重做操作
  })



  // MARK 5.快捷键提示：如果用户按下了已注册的快捷键，但不知道对应的操作，你可以显示一个提示。
  shortcutPlugin.registerShortcut('Ctrl+H', () => {
    // 显示帮助提示
  })



  // MARK 6.自定义配置：允许用户自定义快捷键映射和启用/禁用某些快捷键功能。
  const customShortcuts = {
    'Ctrl+D': 'delete',
    'Ctrl+E': 'export',
    // ...其他自定义映射
  }
  shortcutPlugin.configureShortcuts(customShortcuts)
  shortcutPlugin.enableShortcut('Ctrl+D') // 启用快捷键
  shortcutPlugin.disableShortcut('Ctrl+E') // 禁用快捷键
}
