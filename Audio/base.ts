const musicNameList = [
	'ADVENTURE_PARTY.mp3',
	'像你这样的大师.mp3',
	'十二生肖闯江湖.mp3',
	'春风不解意.mp3',
	'果宝特攻.mp3',
	'横冲直撞.mp3',
	'绿色的旋律.mp3'
]

const INTERACTION_EVENT = ['touchstart', 'keydown', 'pointerdown', 'mousedown']

function getMusicName () {
	const randomIndex = Math.ceil(Math.random() * 7) - 1
	const musicName = musicNameList[randomIndex]
	console.log(`开始播放：${musicName.split('.')[0]}`)
	return musicName
}

const eventStrategy: any = {
	play (el: HTMLElement, audioEle: HTMLAudioElement) {
		el.addEventListener('click', () => {
			audioEle.play()
		})
	},
	pause (el: HTMLElement, audioEle: HTMLAudioElement) {
		el.addEventListener('click', () => {
			audioEle.pause()
		})
	},
	prev (el: HTMLElement, audioEle: HTMLAudioElement) {
		el.addEventListener('click', () => {
			console.log('prev')
		})
	},
	next (el: HTMLElement, audioEle: HTMLAudioElement) {
		el.addEventListener('click', () => {
			console.log('next')
		})
	},
	// forward (el: HTMLElement, _: HTMLAudioElement, audio: AudioTool) {
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

class AudioTool {
	// 音频的上下文对象
	audioContext: any
	// 音频的源信息（arrayBuffer）
	audioSource: any = {}
	// 音频元素
	audioEle: HTMLAudioElement = document.createElement('audio')
	private _initAudioContext
	constructor(url: string, container: HTMLElement | string, private options?: any) {
		this._initAudioContext = throttle(this.initAudioContext.bind(this), 100)

		// this.initContainer(container)

		this.bindBtnListener()

		this.createBlobUrl(url)
			.then(audioUrl => {
				this.audioEle.src = audioUrl
				this.listenInteraction()
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
			strategyMethod && strategyMethod(target, this.audioEle, this)
		})
	}

	// 创建音频上下文对象
	private initAudioContext () {
		// 创建audioContext前必须与文档有交互（点击/移动鼠标），否则音频无法播放
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

new AudioTool(
	`./assets/${getMusicName()}`,
	'#container',
	{
		autoplay: true,
		buttonTarget: {
			play: '.play',
			pause: '.pause',
			prev: '.prev',
			next: '.next',
			forward: '.forward',
			backward: '.backward'
		}
	}
)
