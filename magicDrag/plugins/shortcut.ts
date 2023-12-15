import { Plugin } from '../manager'
import { ref } from '@vue/reactivity'

const shiftIsPress = ref(false)
const altIsPress = ref(false)
const ctrlIsPress = ref(false)

const defaultShortcut = {
	'ctrl + a': event => {
		event.preventDefault()
		console.log('全选')
	},
	'ctrl + c': event => {
		event.preventDefault()
		console.log('复制')
	},
	'ctrl + v': event => {
		event.preventDefault()
		console.log('粘贴')
	},
	'ctrl + h': event => {
		event.preventDefault()
		console.log('帮助')
	},
	'ctrl + z': event => {
		event.preventDefault()
		console.log('撤销')
	},
	'ctrl + y': event => {
		event.preventDefault()
		console.log('重做')
	}
}

class Shortcut implements Plugin {
	name: string
	static CTRL = 'CTRL'
	static SHIFT = 'SHIFT'
	static ALT = 'ALT'
	private enableMap: Record<string, boolean> = {}
	private shortcuts: Record<string, Array<{ action: (...args: any[]) => void, priority: number }>> = {}
	constructor() {
		this.name = 'shortcut'
		this.bindTriggerShortcut = this.triggerShortcut.bind(this)
		this.configureShortcuts(defaultShortcut)
	}
	init() {
		window.addEventListener('keydown', this.bindTriggerShortcut)
		window.addEventListener('keyup', this.getDescribeFromEvent)
	}
	unbind() {
		window.removeEventListener('keydown', this.bindTriggerShortcut)
    window.removeEventListener('keyup', this.getDescribeFromEvent)
	}
	// 注册快捷键
	registerShortcut(shortcut: string, action: (...args: any[]) => void, options?: { priority? }) {
		shortcut = shortcut.replaceAll(' ', '').toUpperCase()
		shortcut = this.functionOrder(shortcut)

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
    if (shortcut.trim().indexOf('++') > -1) {
      throw Error('+ 不可以做为快捷键操作的key，如有必要请自行实现')
    }
		const keyList = []
		shortcut.indexOf(Shortcut.CTRL) > -1 && keyList.push(Shortcut.CTRL)
		shortcut = shortcut.replace(Shortcut.CTRL, '')
		shortcut.indexOf(Shortcut.SHIFT) > -1 && keyList.push(Shortcut.SHIFT)
		shortcut = shortcut.replace(Shortcut.SHIFT, '')
		shortcut.indexOf(Shortcut.ALT) > -1 && keyList.push(Shortcut.ALT)
		shortcut = shortcut.replace(Shortcut.ALT, '')
		shortcut = shortcut.replaceAll('+', '')
		keyList.push(shortcut)
		return keyList.join('+')
	}
	// 触发快捷键
	triggerShortcut(event: KeyboardEvent) {
		const shortcut = this.getDescribeFromEvent(event)
		if (this.shortcuts[shortcut]) {
			this.shortcuts[shortcut].forEach(item => item.action(event))
		}
	}
	// 获取键盘事件的快捷键描述
	getDescribeFromEvent(event: KeyboardEvent) {
		listenSpecialKey()

		const describe = []
		if (event.ctrlKey) describe.push(Shortcut.CTRL)
		if (event.shiftKey) describe.push(Shortcut.SHIFT)
		if (event.altKey) describe.push(Shortcut.ALT)
		describe.push(event.key.toUpperCase())
		return describe.join('+')
		function listenSpecialKey() {
			if (event.key === 'Control') ctrlIsPress.value = event.type === 'keydown'
			if (event.key === 'Shift') shiftIsPress.value = event.type === 'keydown'
			if (event.key === 'Alt') altIsPress.value = event.type === 'keydown'
		}
	}
	// 配置默认快捷键
	configureShortcuts(shortcuts) {
		for (const shortcutsKey in shortcuts) {
			this.registerShortcut(shortcutsKey, shortcuts[shortcutsKey])
		}
	}
	// 启用快捷键
	enableShortcut(shortcut) {}
	// 禁用快捷键
	disableShortcut(shortcut) {}
	bindTriggerShortcut
}

export default Shortcut

export function useSpecialKey() {
	return { ctrlIsPress, shiftIsPress, altIsPress }
}
