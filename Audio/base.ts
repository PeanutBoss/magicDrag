class Watcher<T extends string> {
	private readonly eventMap: any
	constructor() {
		this.eventMap = {}
	}
	on (event: T, callback: Function) {
		let cbs = this.eventMap[event]
		if (!cbs || !cbs.length) cbs = this.eventMap[event] = []
		cbs.push(callback)
	}
	once (event: T, callback: Function) {
		let cbs = this.eventMap[event]
		if (!cbs || !cbs.length) cbs = this.eventMap[event] = []
		const newCB = () => {
			callback()
			this.eventMap[event] = cbs.filter((cb: Function) => {
				return cb !== newCB
			})
		}
		cbs.push(newCB)
	}
	emit (event: T) {
		if (!(event in this.eventMap)) return
		const cbs = this.eventMap[event]
		cbs.forEach((cb: Function) => cb())
	}
}

const INTERACTION_EVENT = ['touchstart', 'keydown', 'pointerdown', 'mousedown']

const eventStrategy: any = {
	play (el: HTMLElement, audio: Player, key: string) {
		const audioEle = audio.audioEle
		const { buttonAfterCallback } = audio.options
		let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
		el.addEventListener('click', () => {
			audioEle.play()
			buttonAfterCB && buttonAfterCB()
		})
	},
	pause (el: HTMLElement, audio: Player, key: string) {
		const audioEle = audio.audioEle
		const { buttonAfterCallback } = audio.options
		let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
		el.addEventListener('click', () => {
			audioEle.pause()
			buttonAfterCB && buttonAfterCB()
		})
	},
	prev (el: HTMLElement, _: Player) {
		el.addEventListener('click', () => {
			console.log('prev')
		})
	},
	next (el: HTMLElement, _: Player) {
		el.addEventListener('click', () => {
			console.log('next')
		})
	}
}

function throttle (fn: any, delay: number) {
	let flag = true
	return () => {
		if ( !flag ) return
		flag = false
		setTimeout(() => {
			fn()
			flag = true // 核心
		}, delay)
	}
}

enum State {
	PLAYING = 'PLAYING',
	ENDED = 'ENDED',
	PAUSE = 'PAUSE',
}

export class Player {
  private loopWay = '' // 策略模式处理
	private sourceLoaded: boolean = false // 音频资源是否加载完毕
	state = State.ENDED // 播放器当前状态
	private audioBufferSource: any // 音频源
  private audioSource: any // 音频源
	watcher = new Watcher<'ended' | 'pause' | 'playing'>()
	// 音频的上下文对象
	audioContext: any
	// 音频的源信息（arrayBuffer）
	audioData: any = {}
	// 音频元素
	audioEle: HTMLAudioElement = document.createElement('audio')
	private readonly _initAudioContext
	constructor(url: string, container: HTMLElement | string, public options?: any) {
		this._initAudioContext = throttle(this.initAudioContext.bind(this), 100)
    options.show && this.initContainer(container)

		this.bindBtnListener()
		this.startWatch()

		this.createBlobUrl(url)
			.then(audioUrl => {
				this.audioEle.src = audioUrl
				this.listenInteraction()
			})
	}

	startWatch () {
		this.watcher.on('playing', () => {
			console.log('playing')
			this.state = State.PLAYING
		})
		this.watcher.on('pause', () => {
			console.log('pause')
			this.state = State.PAUSE
		})
		this.watcher.on('ended', () => {
			console.log('ended')
			this.state = State.ENDED
		})
		this.audioEle.addEventListener('playing', () => {
			this.watcher.emit('playing')
		})
		this.audioEle.addEventListener('pause', () => {
			this.watcher.emit('pause')
		})
		this.audioEle.addEventListener('ended', () => {
			this.watcher.emit('ended')
		})
    // 播放发生错误
		this.audioEle.addEventListener('error', error => {
      console.log(error, 'error')
			// this.watcher.emit('ended')
		})
    // 停止播放（例如切换下一个音频，当前音频就会终止播放）
		this.audioEle.addEventListener('abort', abort => {
      console.log(abort, 'abort')
			// this.watcher.emit('ended')
		})
    // 加载中止
		this.audioEle.addEventListener('stalled ', stalled => {
      console.log(stalled, 'stalled')
			// this.watcher.emit('ended')
		})
	}

	// 开始播放
	play () {
		this.audioEle.play()
	}
	// 暂停播放
	pause () {
		this.audioEle.pause()
	}
	// 停止播放
	ended () {
		this.audioEle.pause()
		setTimeout(() => {
			this.watcher.emit('ended')
		})
	}
  /*
  * KNOW 使用 audioBufferSource 控制音频与audio是独立的两个播放器
  * */
  // 快进
  forward () {
    this.audioEle.currentTime = this.audioEle.currentTime + 1
  }
	// 切换播放的音频
	async changeAudio (url: string) {
		this.audioEle.src = await this.createBlobUrl(url)
		this.audioEle.addEventListener('loadeddata', () => {
			this.audioEle.play()
		})
	}

	showList (el: HTMLElement | string) {
		if (typeof el === 'string') {
			document.querySelector(el)
		}
	}

	// 为按钮绑定click事件
	private bindBtnListener () {
		const { buttonTarget } = this.options
		if (!buttonTarget) return
		Object.keys(buttonTarget).forEach(btnName => {
			let target = buttonTarget[btnName]
			if (typeof target === 'string') {
				target = document.querySelector(target)
			}
			const strategyMethod = eventStrategy[btnName]
			strategyMethod && strategyMethod(target, this, btnName)
		})
	}

	// 创建音频上下文对象
	private initAudioContext () {
		// 创建audioContext前必须与文档有交互（点击/移动鼠标），否则音频无法播放
		console.log('---')
		this.audioContext = new window.AudioContext()
    // this.createBufferSource()
		// audioContext创建完毕，停止监听与文档的交互
		this.stopListenInteraction()

    this.audioSource = this.audioContext.createMediaElementSource(this.audioEle)
		const gainNode = this.audioContext.createGain()
		gainNode.gain.value = 0.3
    this.audioSource.connect(gainNode)
		gainNode.connect(this.audioContext.destination)
	}
  async createBufferSource () {
    if (this.sourceLoaded && this.audioContext) {
      // 解码后arrayBuffer会被清空
      this.audioData.audioBuffer = await this.audioContext.decodeAudioData(this.audioData.arrayBuffer)
      this.audioBufferSource = this.audioContext.createBufferSource()
      this.audioBufferSource.buffer = this.audioData.audioBuffer
    }
  }

	// 将音频播放器添加到页面中
	private initContainer (container: HTMLElement | string) {
		if (typeof container === 'string') {
			const el = document.querySelector(container)
			el?.appendChild(this.audioEle)
		} else {
			container.appendChild(this.audioEle)
		}
		this.audioEle.setAttribute('controls', '')
	}


	// 根据相对路径创建文件url
	async createBlobUrl (url: string) {
		const response = await fetch(url)
		this.audioData.arrayBuffer = await response.arrayBuffer() // 保存音频对应的arrayBuffer

    // const blob = await response.blob()
    const blob = new Blob([this.audioData.arrayBuffer], { type: 'audio/mp3' })
    // 视频资源加载完毕
    this.sourceLoaded = true

    // await this.createBufferSource()

		// TODO 切换音频时应该销毁该url 或 将该url缓存，关闭页面时再销毁
	  return URL.createObjectURL(blob)
	}

	// 浏览器限制播放器的滥用，只有用户与文档进行手势交互后创建上下文对象才能正常使用
	listenInteraction () {
		INTERACTION_EVENT.forEach(eventName => {
			window.addEventListener(eventName, this._initAudioContext)
		})
	}
	stopListenInteraction () {
		INTERACTION_EVENT.forEach(eventName => {
			window.removeEventListener(eventName, this._initAudioContext)
		})
	}
}
