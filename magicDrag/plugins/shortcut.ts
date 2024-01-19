import { Plugin } from '../manager'
import { ref } from '@vue/reactivity'
import { onceExecute } from '../utils/tools'

const shiftIsPress = ref(false)
const altIsPress = ref(false)
const ctrlIsPress = ref(false)

type TriggerType = 'KEY_UP' | 'KEY_DOWN'
type ShortcutCons = ((e: MouseEvent) => void) | { action: (e: MouseEvent) => void } & ShortcutOptions
type ShortcutOptions = {
	triggerType?: TriggerType,
	continuous?: boolean
}

const shortcutConfig: Record<string, ShortcutCons> = {
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
		triggerType?: TriggerType
	}>> = {}
	private shortcutCache = {}
	bindProcessKeydown
	bindProcessKeyup
	constructor() {
		this.name = 'shortcut'
		this.configureShortcuts(shortcutConfig)

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
	triggerAction(event, shortcutKey: string, triggerType: TriggerType) {
		const _this = this

		// 如果禁用快捷键，不执行操作
		if (!this.enableMap[shortcutKey]) return

		// 快捷键没有对应操作
		if (!this.shortcuts[shortcutKey] || !this.shortcuts[shortcutKey].length) return

		triggerType === Shortcut.KEY_DOWN ?
			triggerKeydown() :
			triggerKeyup()

		function triggerKeydown() {
			packShortcut()
			execute(_this.shortcutCache[shortcutKey])
		}
		function triggerKeyup() {
			execute(getTypeShortcut(_this.shortcuts[shortcutKey]))
		}
		// 执行回调任务
		function execute(shortcutList) {
			shortcutList.forEach(item => item.action(event))
		}
		// 获取triggerType对应的操作
		function getTypeShortcut(shortcutList) {
			return shortcutList
				.filter(item => item.triggerType === triggerType)
		}
		// 对只需要执行一次的操作进行包装
		function packShortcut() {
			// 如果没有缓存（被包装的数据）
			if (!_this.shortcutCache[shortcutKey]) {
				_this.shortcutCache[shortcutKey] = getTypeShortcut(_this.shortcuts[shortcutKey])
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
	 * @param shortcutKey 快捷键key
	 * @param action 触发快捷键的操作
	 * @param options type: 事件在按下还是抬起时触发, continuous: 按键一直按下时是否允许连续触发（只有按下可以连续触发）
	 */
	registerShortcut(shortcutKey: string, action: (...args: any[]) => void, options: ShortcutOptions = {}) {
		const { triggerType = Shortcut.KEY_DOWN, continuous = false } = options
		shortcutKey = this.functionOrder(shortcutKey)

		this.enableMap[shortcutKey] = this.enableMap[shortcutKey] ?? true
		if (!this.shortcuts[shortcutKey]) {
			this.shortcuts[shortcutKey] = []
		}

		this.shortcuts[shortcutKey].push({
			action,
			triggerType,
			continuous
		})
	}

	// 快捷键描述排序
	functionOrder(shortcutKey) {
    if (shortcutKey.trim().indexOf('++') > -1) {
      throw Error('+ 不可以做为快捷键操作的key，如有必要请自行实现')
    }
		shortcutKey = shortcutKey.replaceAll(' ', '').toUpperCase()
		const keyList = []
		shortcutKey.indexOf(Shortcut.CTRL) > -1 && keyList.push(Shortcut.CTRL)
		shortcutKey = shortcutKey.replace(Shortcut.CTRL, '')
		shortcutKey.indexOf(Shortcut.SHIFT) > -1 && keyList.push(Shortcut.SHIFT)
		shortcutKey = shortcutKey.replace(Shortcut.SHIFT, '')
		shortcutKey.indexOf(Shortcut.ALT) > -1 && keyList.push(Shortcut.ALT)
		shortcutKey = shortcutKey.replace(Shortcut.ALT, '')
		shortcutKey = shortcutKey.replaceAll('+', '')
		keyList.push(shortcutKey)
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
	configureShortcuts(shortcutConfig: Record<string, ShortcutCons>) {
		for (const SK in shortcutConfig) {
			if (typeof shortcutConfig[SK] === 'function') {
				this.registerShortcut(SK, shortcutConfig[SK] as Function, { triggerType: Shortcut.KEY_DOWN, continuous: false })
			} else {
				const { action, triggerType = Shortcut.KEY_DOWN, continuous = false } = shortcutConfig[SK]
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
