class Shortcut {
	private shortcutMap = {}
	private _executeBefore = null
	constructor() {
		this.bindKeyDown = this.keyDown.bind(this)
		this.bindKeyUp = this.keyUp.bind(this)
	}
	registerShortcut(shortcut, action, { type }) {
		if (!this.shortcutMap[shortcut]) this.shortcutMap[shortcut] = []
		this.shortcutMap[shortcut].push({
			[type]: action
		})
	}
	keyDown(event) {
		if (this._executeBefore?.()) return
		this.actions().forEach(short => short[Shortcut.KEY_DOWN]?.(event))
	}
	keyUp(event) {
		if (this._executeBefore?.()) return
		this.actions().forEach(short => short[Shortcut.KEY_UP]?.(event))
	}
	setBeforeCB(cb) {
		this._executeBefore = cb
	}
	actions() {
		return this.shortcutMap[this.eventDescribe(event)] || []
	}
	eventDescribe(event) {
		return event.key
	}
	stopListen() {
		window.removeEventListener(Shortcut.KEY_DOWN, this.bindKeyDown)
		window.removeEventListener(Shortcut.KEY_UP, this.bindKeyUp)
	}
	startListen() {
		window.addEventListener(Shortcut.KEY_DOWN, this.bindKeyDown)
		window.addEventListener(Shortcut.KEY_UP, this.bindKeyUp)
	}
	bindKeyDown
	bindKeyUp
	static KEY_DOWN = 'keydown'
	static KEY_UP = 'keyup'
}

export default Shortcut
