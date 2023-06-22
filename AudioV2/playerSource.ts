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
  emit (event: T, ...rest: any[]) {
    if (!(event in this.eventMap)) return
    const cbs = this.eventMap[event]
    cbs.forEach((cb: Function) => cb(...rest))
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

type WatcherEmit = 'ended' | 'pause' | 'playing' | 'contextCreated' | 'timeupdate' | 'abort' | 'progress' | 'volumeupdate' | 'loadeddata' | 'loadedBuffer' | 'canplay' | 'changePlay' | 'loopWay'

type SourceType = 'Media' | 'Buffer'
const MediaType = 'Media'
const BufferType = 'Buffer'

abstract class Player {
  watcher = new Watcher<WatcherEmit>()
  // 监听用户与浏览器的手势交互事件
  private readonly INTERACTION_EVENT = ['touchstart', 'keydown', 'pointerdown', 'mousedown']
  private readonly _initContext
  playerContext: any
  playerData: any = {} // 当前音频数据
  playerDom: HTMLAudioElement | HTMLVideoElement // 音频播放器元素
  gainNode: any

  /**
   * @param playerType 音频/视频播放器
   * @param type 音源基于Audio元素（Media）还是二进制数据（Buffer）
   * @protected
   */
  protected constructor (private playerType: 'AUDIO' | 'VIDEO', public type: 'Media' | 'Buffer') {
    // 创建播放器元素
    if (this.playerType === 'AUDIO') {
      this.playerDom = document.createElement('audio')
    } else if (this.playerType === 'VIDEO') {
      this.playerDom = document.createElement('video')
    } else {
      throw new Error('playerType 类型可选值为"AUDIO"、"VIDEO"')
    }

    this._initContext = throttle(this.initContext.bind(this), 100)
    this.listenInteraction()
  }
  abstract setMediaCurrentTime (time: number): void
  abstract changeCurrentPlaying (index: number): void
  abstract getPlayListCount (): number
  // 创建上下文对象 FIXME 未交互时创建上下文对象，如果不与其他节点连接时可以播放（初始化后不能播放）
  createContext () {
    console.log('创建上下文对象')
    this.playerContext = new window.AudioContext()
    // 可以加载Buffer
    this.watcher.emit('loadedBuffer')
  }
  // 初始化上下文对象
  abstract initContext (): void
  listenInteraction () {
    this.INTERACTION_EVENT.forEach(eventName => {
      window.addEventListener(eventName, this._initContext)
    })
  }
  stopListenInteraction () {
    this.INTERACTION_EVENT.forEach(eventName => {
      window.removeEventListener(eventName, this._initContext)
    })
  }
}

// 播放器 TODO 增加 audioBufferSource 控制播放功能
export class AudioPlayer extends Player {
  private sourceLoaded: boolean = false // 音频资源是否加载完毕
  public audioBufferSource: AudioBufferSourceNode | null = null // 音频源

  // -----------------------

  private audioContext: any // 音频的上下文对象

  constructor(private playList: any[], playerType: 'AUDIO' | 'VIDEO', public type: SourceType) {
    super(playerType, type)
    this.playList = playList
    this.startWatch()
  }
  initContext() {
    this.createContext()
    // MARK 初始化audioContext前必须与文档有手势交互，否则音频无法播放
    // context初始化完毕，停止监听与文档的交互
    this.stopListenInteraction()

    // 通知上下文对象已经创建完成
    this.watcher.emit('contextCreated')
  }

  // 调整播放进度
  setMediaCurrentTime (time: number) {
    this.playerDom.currentTime = time
  }

  // 切换播放的音频
  changeCurrentPlaying (index: number) {
    this.playerData = this.playList[index]
    this.playerDom.src = this.playerData.url
    this.getBufferByUrl()
  }

  async getBufferByUrl () {
    const response = await fetch(this.playerData.url)
    this.playerData.arraybuffer = await response.arrayBuffer()
    console.log('buffer加载完毕')
  }

  // 播放列表条数
  getPlayListCount () {
    return this.playList.length
  }

  // 监听audio元素
  startWatch () {
    this.playerDom.addEventListener('loadeddata', () => {
      this.watcher.emit('loadeddata', { duration: this.playerDom.duration })
    })
    this.playerDom.addEventListener('playing', () => {
      this.watcher.emit('playing')
    })
    this.playerDom.addEventListener('pause', () => {
      this.watcher.emit('pause')
    })
    this.playerDom.addEventListener('ended', () => {
      this.watcher.emit('ended')
    })
    this.playerDom.addEventListener('timeupdate', event => {
      const { currentTime, duration } = this.playerDom
      this.watcher.emit('timeupdate', { currentTime, duration })
    })
    // 播放发生错误
    this.playerDom.addEventListener('error', error => {
      console.log(error, 'error')
      // this.watcher.emit('error')
    })
    // 停止播放（例如切换下一个音频，当前音频就会终止播放）
    this.playerDom.addEventListener('abort', abort => {
      this.watcher.emit('abort')
    })
    // 加载中止
    this.playerDom.addEventListener('stalled ', stalled => {
      // this.watcher.emit('stalled')
    })
    // 加载进度
    this.playerDom.addEventListener('progress', event => {
      // this.watcher.emit('stalled')
    })
  }

  async createBufferSource () {
    if (this.sourceLoaded && this.audioContext) {
      // 解码后arrayBuffer会被清空
      this.playerData.audioBuffer = await this.audioContext.decodeAudioData(this.playerData.arrayBuffer)
      this.audioBufferSource = this.audioContext.createBufferSource() as AudioBufferSourceNode
      this.audioBufferSource.buffer = this.playerData.audioBuffer
    }
  }

  // 根据相对路径创建文件url
  async createBlobUrl (url: string) {
    const response = await fetch(url)
    this.playerData.arrayBuffer = await response.arrayBuffer() // 保存音频对应的arrayBuffer

    // const blob = await response.blob()
    const blob = new Blob([this.playerData.arrayBuffer], { type: 'audio/mp3' })
    // 视频资源加载完毕
    this.sourceLoaded = true

    // await this.createBufferSource()

    // TODO 切换音频时应该销毁该url 或 将该url缓存，关闭页面时再销毁
    return URL.createObjectURL(blob)
  }
  setBufferSource (source: AudioBufferSourceNode) {
    this.audioBufferSource = source
  }
}

enum LoopWay {
  SEQUENCE = 'SEQUENCE',
  RANDOM = 'RANDOM',
  SINGLE = 'SINGLE',
  LOOP = 'LOOP'
}

const PlayStrategy = {
  // 顺序播放
  SEQUENCE (currentIndex: number, totalCount: number, action: 'prev' | 'next'): number {
    if (action === 'next') {
      if (currentIndex === totalCount - 1) return currentIndex
      return currentIndex + 1
    } else {
      if (currentIndex === 0) return 0
      return currentIndex - 1
    }
  },
  // 随机播放
  RANDOM (currentIndex: number, totalCount: number, action: 'prev' | 'next'): number {
    let randomIndex = getMaxNumber(totalCount) - 1
    if (randomIndex === currentIndex) {
      PlayStrategy.RANDOM(currentIndex, totalCount, action)
    }
    return randomIndex
  },
  // 单曲循环
  SINGLE (currentIndex: number, totalCount: number, action: 'prev' | 'next'): number {
    return currentIndex
  },
  // 列表循环
  LOOP (currentIndex: number, totalCount: number, action: 'prev' | 'next'): number {
    // 电极上一个
    if (action === 'prev') {
      if (currentIndex === 0) return totalCount - 1
      return currentIndex - 1
    } else {
      if (currentIndex === totalCount - 1) return 0
      return currentIndex + 1
    }
  }
}

// 控制器
export class PlayerControls {
  private playIndex = 0 // 当前播放数据在列表中的索引
  private loopWay: LoopWay = LoopWay.SEQUENCE // 循环方式 - 默认顺序播放
  private readonly _play = this.play.bind(this)
  private isPlaying = false
  private gainNode: any
  constructor (private player: AudioPlayer, private options: any = {}) {
    // watchAction中对 changePlay 事件添加了callback，因此第一次触发 changePlay 事件
    // 需要在watchAction之前，否则会自动播放
    this.player.watcher.emit('changePlay', { playIndex: this.playIndex })
    this.watchAction()
    // 监听上下文对象是否创建完毕
    this.player.watcher.on('contextCreated', this.createGainNode.bind(this))
  }
  createGainNode () {
    console.log('创建音频节点')
    const source = this.player.playerContext.createMediaElementSource(this.player.playerDom)
    this.gainNode = this.player.playerContext.createGain()
    console.log(this.options.initialVolume)
    this.gainNode.gain.value = this.options.initialVolume
    this.player.watcher.emit('volumeupdate', { volume: this.options.initialVolume })

    source.connect(this.gainNode)
    this.gainNode.connect(this.player.playerContext.destination)
  }
  // 监听播放器事件
  watchAction () {
    // 音视频加载完成后执行播放操作
    if (this.options.autoplay) {
      this.player.watcher.on('loadeddata', this._play)
    }

    this.player.watcher.on('changePlay', this._play)
    this.player.watcher.on('playing', () => {
      this.isPlaying = true
    })
    this.player.watcher.on('pause', () => {
      this.isPlaying = false
    })

    this.player.watcher.on('ended', () => {
      // 音视频播放完成后进入播放下一个音视频的逻辑
      this.playNext()
    })
  }
  // TODO 下一个音频
  playNext () {
    const getIndex = this.getStrategy()
    const nextIndex = getIndex(this.playIndex, this.player.getPlayListCount(), 'next')
    // 如果将要播放的下一个音视频的索引等于当前索引，不执行操作
    if (nextIndex === this.playIndex) return
    this.changeAudio(nextIndex)
  }
  // TODO 上一个音频
  playPrev () {
    const getIndex = this.getStrategy()
    const prevIndex = getIndex(this.playIndex, this.player.getPlayListCount(), 'prev')
    // 如果将要播放的上一个音视频的索引等于当前索引，不执行操作
    if (prevIndex === this.playIndex) return
    this.changeAudio(prevIndex)
  }
  // 切换音频
  changeAudio (index: number) {
    this.playIndex = index
    this.player.changeCurrentPlaying(index)
    this.player.watcher.emit('changePlay', { playIndex: this.playIndex })
  }
  // 控制声音
  controlVolume (volume: number) {
    this.player.watcher.emit('volumeupdate', { volume })
    if (this.player.type === MediaType) {
      this.player.playerDom.volume = volume
    } else {
      this.gainNode.gain.value = volume
    }
  }
  // 调整进度
  changePlayProcess (currentTime: number) {
    if (this.player.type === MediaType) {
      this.player.setMediaCurrentTime(currentTime)
    } else {
      console.log('Buffer - 调整进度')
    }
  }
  start () {
    // 默认播放第一首
    this.player.changeCurrentPlaying(this.playIndex)
  }
  // 播放
  play () {
    // this.player.type === MediaType && this.player.playerDom.play()
    (this.player.audioBufferSource as AudioBufferSourceNode).start()
  }
  // 暂停
  pause () {
    this.player.type === MediaType && this.player.playerDom.pause()
  }
  // 切换循环方式
  toggleLoopWay () {
    if (this.loopWay === LoopWay.SEQUENCE) {
      this.loopWay = LoopWay.LOOP
    } else if (this.loopWay === LoopWay.LOOP) {
      this.loopWay = LoopWay.SINGLE
    } else if (this.loopWay === LoopWay.SINGLE) {
      this.loopWay = LoopWay.RANDOM
    } else if (this.loopWay === LoopWay.RANDOM) {
      this.loopWay = LoopWay.SEQUENCE
    }
    this.player.watcher.emit('loopWay', this.loopWay)
  }
  // 获取下一个播放下标的方法
  private getStrategy () {
    return PlayStrategy[this.loopWay]
  }
}

// 可视化
export class PlayerVisual {
  private bufferLength: any
  private dataArray: any
  private analyserNode: any
  private canvas: any
  private canvasCtx: any
  private audioBufferSource: any
  constructor (private player: AudioPlayer, private options?: any) {
    this.player.watcher.on('loadedBuffer', this.createAnalyser.bind(this))
  }
  // 创建分析器
  async createAnalyser () {
    console.log('创建音频分析器')
    this.createCanvasContext()

    console.log(this.player.playerData.arraybuffer, 'this.player.playerData.arraybuffer')
    const audioBuffer = await this.player.playerContext.decodeAudioData(this.player.playerData.arraybuffer)
    const audioBufferSource = this.player.playerContext.createBufferSource()
    audioBufferSource.buffer = audioBuffer

    this.player.setBufferSource(audioBufferSource)

    // 创建音频分析器
    this.analyserNode = this.player.playerContext.createAnalyser()
    this.analyserNode.fftSize = 2048 // 设置 FFT 大小
    // 连接音频源和音频分析器
    audioBufferSource.connect(this.analyserNode)
    this.analyserNode.connect(this.player.playerContext.destination)
    // 创建一个数组用于保存频谱数据
    this.bufferLength = this.analyserNode.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)
    /*
    * MARK 单独使用 mediaAudioSource 不能做可视化操作
    *  如果要做可视化需要配合 audioBufferSource
    *  或直接使用 audioBufferSource 控制音频播放
    * */
    // audioBufferSource.start()
    this.draw()
  }
  // 获取canvas和上下文对象
  createCanvasContext () {
    this.canvas = document.querySelector(this.options.canvasSelector)
    this.canvasCtx = this.canvas.getContext('2d')
  }
  draw () {
    // 请求下一帧动画
    requestAnimationFrame(this.draw.bind(this))
    // 获取频谱数据
    this.analyserNode.getByteFrequencyData(this.dataArray)
    // 清空画布
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.createSpectrum()
  }

  createSpectrum () {
    const bufferLength = this.analyserNode.frequencyBinCount
    const barWidth = (this.canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = this.dataArray[i] / 2;
      this.canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  createFalls () {
    const bufferLength = this.analyserNode.frequencyBinCount
    const fallsWidth = this.canvas.width / bufferLength;
    let fallsX = 0
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
      const hue = (i / bufferLength) * 360;
      this.canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.canvasCtx.fillRect(fallsX, this.canvas.height - barHeight, fallsWidth, barHeight);
      fallsX += fallsWidth;
    }
  }

  createWave () {
    this.analyserNode.getByteTimeDomainData(this.dataArray);
    const bufferLength = this.analyserNode.frequencyBinCount
    this.canvasCtx.lineWidth = 1;
    this.canvasCtx.strokeStyle = 'rgb(0, 255, 255)';
    this.canvasCtx.beginPath();
    const sliceWidth = this.canvas.width / bufferLength;
    let waveX = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * this.canvas.height) / 2;
      if (i === 0) {
        this.canvasCtx.moveTo(waveX, y);
      } else {
        this.canvasCtx.lineTo(waveX, y);
      }
      waveX += sliceWidth;
    }
    this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.canvasCtx.stroke();
  }
}

function getMaxNumber (max: number) {
  return Math.ceil(Math.random() * max)
}

function isContinue (cur: number, max: number) {
  if (cur <= 0) return false
  if (cur >= max - 1) return false
  return true
}
