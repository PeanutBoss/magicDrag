import { Plugin } from '../manager'
import { ref } from '@vue/reactivity'
import { onceExecute } from '../utils/tools'

const shiftIsPress = ref(false)
const altIsPress = ref(false)
const ctrlIsPress = ref(false)

type TriggerType = 'KEY_UP' | 'KEY_DOWN'
type ShortcutCons = ((e: MouseEvent) => void) | {
	action: (e: MouseEvent) => void,
	triggerType?: TriggerType,
	continuous?: boolean
}

const defaultShortcut: Record<string, ShortcutCons> = {
	'ctrl + a': {
		action: event => {
			event.preventDefault()
			console.log('全选')
		},
		triggerType: 'KEY_DOWN'
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
		this.enableMap = null
		this.shortcuts = null
		this.shortcutCache = null
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
	triggerAction(event, shortcut: string, triggerType: TriggerType) {
		const _this = this

		// 如果禁用快捷键，不执行操作
		if (!this.enableMap[shortcut]) return

		// 快捷键没有对应操作
		if (!this.shortcuts[shortcut] || !this.shortcuts[shortcut].length) return

		triggerType === Shortcut.KEY_DOWN ?
			triggerKeydown() :
			triggerKeyup()

		function triggerKeydown() {
			packShortcut()
			execute(_this.shortcutCache[shortcut])
		}
		function triggerKeyup() {
			execute(getTypeShortcut(_this.shortcuts[shortcut]))
		}
		// 执行回调任务
		function execute(shortcuts) {
			shortcuts.forEach(item => item.action(event))
		}
		// 获取triggerType对应的操作
		function getTypeShortcut(shortcuts) {
			return shortcuts
				.filter(item => item.triggerType === triggerType)
		}
		// 对快捷键对象进行包装
		function packShortcut() {
			// 如果没有缓存（被包装的数据）
			if (!_this.shortcutCache[shortcut]) {
				_this.shortcutCache[shortcut] = getTypeShortcut(_this.shortcuts[shortcut])
					// 如果操作不允许连续执行，使用onceExecute对action进行包装，否则使用原有的action
					.map(m => !m.continuous ? { ...m, action: onceExecute(m.action, event) } : m)
			}
		}
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
	registerShortcut(shortcut: string, action: (...args: any[]) => void, { triggerType, continuous }) {
		shortcut = this.functionOrder(shortcut)

		this.enableMap[shortcut] = this.enableMap[shortcut] ?? true
		if (!this.shortcuts[shortcut]) {
			this.shortcuts[shortcut] = []
		}

		this.shortcuts[shortcut].push({
			action,
			triggerType,
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
	configureShortcuts(shortcuts: Record<string, ShortcutCons>) {
		for (const SK in shortcuts) {
			if (typeof shortcuts[SK] === 'function') {
				this.registerShortcut(SK, shortcuts[SK] as Function, { triggerType: Shortcut.KEY_DOWN, continuous: false })
			} else {
				const { action, triggerType = Shortcut.KEY_DOWN, continuous = false } = shortcuts[SK]
				this.registerShortcut(SK, action, { triggerType, continuous })
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

	/**
	 * @description 开启或关闭全部快捷键
	 * @param isEnable 开启或关闭
	 */
	wholeDisOrEn(isEnable: boolean) {
		Object.keys(this.shortcuts)
			.forEach(item => {
				isEnable ?
					this.enableShortcut(item) :
					this.disableShortcut(item)
			})
	}
}

export default Shortcut

// 应该将功能键监听移出去
export function useSpecialKey() {
	return { ctrlIsPress, shiftIsPress, altIsPress }
}
