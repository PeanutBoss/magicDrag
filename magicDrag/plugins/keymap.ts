import { PluginBlueprint } from "../../pluginBlueprint/pluginManager.ts";

class Keymap implements PluginBlueprint.Plugin {
	name: string
	static CTRL = 'CTRL'
	static SHIFT = 'SHIFT'
	static ALT = 'ALT'
	private enableMap: Record<string, boolean> = {}
	private shortcuts: Record<string, Array<{ action: (...args: any[]) => void, priority: number }>> = {}
	constructor() {
		this.name = 'keymap'
		this.bindTriggerShortcut = this.triggerShortcut.bind(this)
	}
	init() {
		window.addEventListener('keydown', this.bindTriggerShortcut)
	}
	unbind() {
		window.removeEventListener('keydown', this.bindTriggerShortcut)
	}
	// 注册快捷键
	registerShortcut(shortcut: string, action: (...args: any[]) => void, options?: { priority? }) {
		shortcut = shortcut.replaceAll(' ', '').toUpperCase()
		shortcut = this.functionOrder(shortcut)
		console.log(shortcut, 'shortcut')

		this.enableMap[shortcut] = this.enableMap[shortcut] ?? true
		const { priority = 0 } = options || {}
		if (!this.shortcuts[shortcut]) {
			this.shortcuts[shortcut] = []
		}
		this.shortcuts[shortcut].push({ action, priority })
		// 优先级高的先执行
		this.shortcuts[shortcut].sort((pre, next) => next.priority - pre.priority)
	}
	// 功能键排序
	functionOrder(shortcut) {
    if (shortcut.indexOf('++') > -1) {
      throw Error('+ 不可以做为快捷键操作的key，如有必要请自行实现')
    }
		const keyList = []
		shortcut.indexOf(Keymap.CTRL) > -1 && keyList.push(Keymap.CTRL)
		shortcut = shortcut.replace(Keymap.CTRL, '')
		shortcut.indexOf(Keymap.SHIFT) > -1 && keyList.push(Keymap.SHIFT)
		shortcut = shortcut.replace(Keymap.SHIFT, '')
		shortcut.indexOf(Keymap.ALT) > -1 && keyList.push(Keymap.ALT)
		shortcut = shortcut.replace(Keymap.ALT, '')
		shortcut = shortcut.replaceAll('+', '')
		keyList.push(shortcut)
		return keyList.join('+')
	}
	// 触发快捷键
	triggerShortcut(event: KeyboardEvent) {
    event.preventDefault()
		const shortcut = this.getDescribeFromEvent(event)
		if (this.shortcuts[shortcut]) {
			this.shortcuts[shortcut].forEach(item => item.action(event))
		}
	}
	// 获取键盘事件的快捷键描述
	getDescribeFromEvent(event: KeyboardEvent) {
		const describe = []
		if (event.ctrlKey) describe.push(Keymap.CTRL)
		if (event.shiftKey) describe.push(Keymap.SHIFT)
		if (event.altKey) describe.push(Keymap.ALT)
		describe.push(event.key.toUpperCase())
		return describe.join('+')
	}
	// 启用快捷键
	enableShortcut(shortcut) {}
	// 禁用快捷键
	disableShortcut(shortcut) {}
	bindTriggerShortcut
}

export default Keymap
