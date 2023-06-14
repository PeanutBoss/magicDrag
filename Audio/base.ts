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
	},
	// forward (el: HTMLElement, _: HTMLAudioElement, audio: Player) {
	// 	const audioBuffer = audio.audioContext.decodeAudioData(audio.audioSource.arrayBuffer)
	// 	const source = audio.audioContext.createBufferSource()
	// 	source.buffer = audioBuffer
	// 	el.addEventListener('click', () => {
	// 		source.start(audio.audioContext.currentTime + 10)
	// 	})
	// }
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

/*
* TODO
* arrayBuffer和audioContext都创建完毕后创建source
* fetch('audio.mp3')
  .then(response => response.arrayBuffer())
  .then(buffer => audioContext.decodeAudioData(buffer))
  .then(audioBuffer => {
    // 创建音频源
    const audioBufferSource = audioContext.createBufferSource();
    audioBufferSource.buffer = audioBuffer;

    // 在特定时间点开始播放音频
    audioBufferSource.start(10); // 在 10 秒的位置开始播放音频

    // 在特定时间点停止播放音频
    audioBufferSource.stop(20); // 在 20 秒的位置停止播放音频

    // 播放结束时触发事件
    audioBufferSource.onended = () => {
      console.log('音频播放结束');
    };
  });
* */
export class Player {
	private sourceLoaded: boolean = false // 音频资源是否加载完毕
	state = State.ENDED // 播放器当前状态
	private audioBufferSource: any
	private watcher: Watcher<'ended' | 'pause' | 'playing'> = new Watcher()
	// 音频的上下文对象
	audioContext: any
	// 音频的源信息（arrayBuffer）
	audioSource: any = {}
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
		// audioContext创建完毕，停止监听与文档的交互
		this.stopListenInteraction()

		const source = this.audioContext.createMediaElementSource(this.audioEle)
		const gainNode = this.audioContext.createGain()
		gainNode.gain.value = 0.3
		source.connect(gainNode)
		gainNode.connect(this.audioContext.destination)
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
		this.audioSource.arrayBuffer = await response.arrayBuffer() // 保存音频对应的arrayBuffer
		// const blob = await response.blob()
		const blob = new Blob([this.audioSource.arrayBuffer], { type: 'audio/mp3' })

		// let base64
		// const reader = new FileReader()
		// reader.onloadend = () => {
		// 	base64 = reader.result
		// }
		// reader.readAsDataURL(blob)

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
