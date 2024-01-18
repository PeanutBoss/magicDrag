import { Plugin } from '../manager'
import { ref } from '@vue/reactivity'
import { onceExecute } from '../utils/tools'

const shiftIsPress = ref(false)
const altIsPress = ref(false)
const ctrlIsPress = ref(false)

const defaultShortcut = {
	'ctrl + a': {
		action: event => {
			event.preventDefault()
			console.log('全选')
		},
		type: 'KEY_UP'
	},
	'ctrl + c': {
		action: event => {
			event.preventDefault()
			console.log('复制')
		},
		continuous: false
	},
	'ctrl + v': {
		action: event => {
			event.preventDefault()
			console.log('粘贴')
		},
		continuous: true
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

type TriggerType = 'KEY_UP' | 'KEY_DOWN'

class Shortcut implements Plugin {
	name: string
	static CTRL = 'CTRL'
	static SHIFT = 'SHIFT'
	static ALT = 'ALT'
	static KEY_UP: TriggerType = 'KEY_UP'
	static KEY_DOWN: TriggerType = 'KEY_DOWN'
	private enableMap: Record<string, boolean> = {}
	private shortcuts: Record<string, Array<{
		action: (...args: any[]) => void,
		continuous?: boolean,
		type?: TriggerType
	}>> = {}
	private shortcutCache = {}
	bindProcessKeydown
	bindProcessKeyup
	constructor() {
		this.name = 'shortcut'
		this.configureShortcuts(defaultShortcut)

		this.bindProcessKeydown = this.processKeydown.bind(this)
		this.bindProcessKeyup = this.processKeyup.bind(this)
	}
	init() {
		window.addEventListener('keydown', this.bindProcessKeydown)
		window.addEventListener('keyup', this.bindProcessKeyup)
	}
	unbind() {
		window.removeEventListener('keydown', this.bindProcessKeydown)
    window.removeEventListener('keyup', this.bindProcessKeyup)
	}

	processKeydown(event) {
		this.listenSpecialKey(event)
		this.triggerAction(event, this.getDescribeFromEvent(event), Shortcut.KEY_DOWN)
	}
	processKeyup(event) {
		this.listenSpecialKey(event)
		this.triggerAction(event, this.getDescribeFromEvent(event), Shortcut.KEY_UP)
		this.shortcutCache[this.getDescribeFromEvent(event)] = null
	}
	// 触发快捷键操作
	triggerAction(event, shortcut: string, type: TriggerType) {
		// 如果禁用快捷键，不执行操作
		if (!this.enableMap[shortcut]) return

		// 快捷键没有对应操作
		if (!this.shortcuts[shortcut] || !this.shortcuts[shortcut].length) return

		if (type === Shortcut.KEY_DOWN) {
			if (!this.shortcutCache[shortcut]) {
				this.shortcutCache[shortcut] = this.shortcuts[shortcut]
					.filter(item => item.type === type)
					.map(m => !m.continuous ? { ...m, action: onceExecute(m.action, event) } : m)
			}
			this.shortcutCache[shortcut]
				.forEach(item => item.action(event))
			return
		}

		this.shortcuts[shortcut]
			.filter(item => item.type === type)
			.forEach(item => item.action(event))
	}
	// 监听功能键
	listenSpecialKey(event) {
		if (event.key === 'Control') ctrlIsPress.value = event.type === 'keydown'
		if (event.key === 'Shift') shiftIsPress.value = event.type === 'keydown'
		if (event.key === 'Alt') altIsPress.value = event.type === 'keydown'
	}

	/**
	 * @description 注册快捷键
	 * @param shortcut 快捷键key
	 * @param action 触发快捷键的操作
	 * @param options type: 事件在按下还是抬起时触发, continuous: 按键一直按下时是否允许连续触发（只有按下可以连续触发）
	 */
	registerShortcut(shortcut: string, action: (...args: any[]) => void, { type, continuous }) {
		shortcut = this.functionOrder(shortcut)

		this.enableMap[shortcut] = this.enableMap[shortcut] ?? true
		if (!this.shortcuts[shortcut]) {
			this.shortcuts[shortcut] = []
		}

		this.shortcuts[shortcut].push({
			action,
			type,
			continuous
		})
	}

	// 快捷键描述排序
	functionOrder(shortcut) {
    if (shortcut.trim().indexOf('++') > -1) {
      throw Error('+ 不可以做为快捷键操作的key，如有必要请自行实现')
    }
		shortcut = shortcut.replaceAll(' ', '').toUpperCase()
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

	// 获取键盘事件的快捷键描述
	getDescribeFromEvent(event: KeyboardEvent) {
		const describe = []
		if (event.ctrlKey) describe.push(Shortcut.CTRL)
		if (event.shiftKey) describe.push(Shortcut.SHIFT)
		if (event.altKey) describe.push(Shortcut.ALT)
		describe.push(event.key.toUpperCase())
		return describe.join('+')
	}

	// 配置默认快捷键
	configureShortcuts(shortcuts) {
		for (const SK in shortcuts) {
			if (typeof shortcuts[SK] === 'function') {
				this.registerShortcut(SK, shortcuts[SK], { type: Shortcut.KEY_DOWN, continuous: false })
			} else {
				const { action, type = Shortcut.KEY_DOWN, continuous = false } = shortcuts[SK]
				this.registerShortcut(SK, action, { type, continuous })
			}
		}
	}
	// 启用快捷键
	enableShortcut(shortcut) {
		this.enableMap[this.functionOrder(shortcut)] = true
	}
	// 禁用快捷键
	disableShortcut(shortcut) {
		this.enableMap[this.functionOrder(shortcut)] = false
	}
}

export default Shortcut

export function useSpecialKey() {
	return { ctrlIsPress, shiftIsPress, altIsPress }
}
