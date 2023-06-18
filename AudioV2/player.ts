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

const eventStrategy: any = {
  play (el: HTMLElement, audio: AudioPlayer, key: string) {
    // const audioEle = audio.audioEle
    // const { buttonAfterCallback } = audio.options
    // let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
    // el.addEventListener('click', () => {
    // 	audioEle.play()
    // 	buttonAfterCB && buttonAfterCB()
    // })
  },
  pause (el: HTMLElement, audio: AudioPlayer, key: string) {
    // const audioEle = audio.audioEle
    // const { buttonAfterCallback } = audio.options
    // let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
    // el.addEventListener('click', () => {
    // 	audioEle.pause()
    // 	buttonAfterCB && buttonAfterCB()
    // })
  },
  prev (el: HTMLElement, _: AudioPlayer) {
    el.addEventListener('click', () => {
      console.log('prev')
    })
  },
  next (el: HTMLElement, _: AudioPlayer) {
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
type WatcherEmit = 'ended' | 'pause' | 'playing' | 'timeupdate' | 'volumeupdate' | 'loadeddata' | 'canplay' | 'changePlay' | 'loopWay'
abstract class Player {
  watcher = new Watcher<WatcherEmit>()
  // 监听用户与浏览器的手势交互事件
  private readonly INTERACTION_EVENT = ['touchstart', 'keydown', 'pointerdown', 'mousedown']
  private readonly _initContext
  playerContext: any
  playerDom: HTMLAudioElement | HTMLVideoElement // 音频播放器元素
  gainNode: any
  protected constructor (private playerType: 'AUDIO' | 'VIDEO') {
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
  abstract setCurrentTime (time: number): void
  abstract changeCurrentPlaying (index: number): void
  abstract getPlayListCount (): number
  initContext () {
    // 创建audioContext前必须与文档有交互（点击/移动鼠标），否则音频无法播放
    console.log('创建上下文对象')
    this.playerContext = new window.AudioContext()
    // context创建完毕，停止监听与文档的交互
    this.stopListenInteraction()

    const source = this.playerContext.createMediaElementSource(this.playerDom)
    this.gainNode = this.playerContext.createGain()
    this.gainNode.gain.value = 0.5
    source.connect(this.gainNode)
    this.gainNode.connect(this.playerContext.destination)
  }
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

// 播放器
export class AudioPlayer extends Player {
  private sourceLoaded: boolean = false // 音频资源是否加载完毕
  private audioBufferSource: any // 音频源

  // -----------------------

  audioData: any = {} // 当前音频数据
  private audioContext: any // 音频的上下文对象

  constructor(private playList: any[], playerType: 'AUDIO' | 'VIDEO') {
    super(playerType)
    this.playList = playList
    this.startWatch()

    setTimeout(() => {
      this.playerDom.setAttribute('controls', '');
      (document.querySelector('.player-body-detail') as HTMLElement).appendChild(this.playerDom)
    }, 500)
  }

  // 调整播放进度
  setCurrentTime (time: number) {
    this.playerDom.currentTime = time
  }

  // 切换播放的音频
  changeCurrentPlaying (index: number) {
    this.audioData = this.playList[index]
    this.playerDom.src = this.audioData.url
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
      // this.watcher.emit('abort')
    })
    // 加载中止
    this.playerDom.addEventListener('stalled ', stalled => {
      // this.watcher.emit('stalled')
    })
  }

  async createBufferSource () {
    if (this.sourceLoaded && this.audioContext) {
      // 解码后arrayBuffer会被清空
      this.audioData.audioBuffer = await this.audioContext.decodeAudioData(this.audioData.arrayBuffer)
      this.audioBufferSource = this.audioContext.createBufferSource()
      this.audioBufferSource.buffer = this.audioData.audioBuffer
    }
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
  constructor (private player: Player, private options: any = {}) {
    // watchAction中对 changePlay 事件添加了callback，因此第一次触发 changePlay 事件
    // 需要在watchAction之前，否则会开启自动播放
    this.player.watcher.emit('changePlay', { playIndex: this.playIndex })
    this.watchAction()
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
    this.player.gainNode.gain.value = volume
  }
  // 调整进度
  changePlayProcess (currentTime: number) {
    this.player.setCurrentTime(currentTime)
  }
  start () {
    // 默认播放第一首
    this.player.changeCurrentPlaying(this.playIndex)
  }
  // 播放
  play () {
    this.player.playerDom.play()
  }
  // 暂停
  pause () {
    this.player.playerDom.pause()
  }
  // TODO 切换循环方式
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
class PlayerVisual {
  constructor (private player: Player) {}
}

function getMaxNumber (max: number) {
  return Math.ceil(Math.random() * max)
}

function isContinue (cur: number, max: number) {
  if (cur <= 0) return false
  if (cur >= max - 1) return false
  return true
}
