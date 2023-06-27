import { AudioPlayer, PlayerControls, PlayerVisual } from './playerVisual.js'
import { getMusicList }  from './musicNameList.js'
import { getTimeByStamp } from './tool.js'
const { createApp, onMounted, ref, reactive, getCurrentInstance } = Vue
const musicList = reactive(getMusicList())
const Component = {
  template: `
    <div class="player">
      <div class="player-header">
        <div class="player-header-name">音乐播放器</div>
      </div>
      <div class="player-body">
        <!-- 音频列表 -->
        <ul class="player-body-list">
          <template v-for="(music, index) in musicList" :key="music.url">
            <li
              :class="{ 'player-body-list-item-playing': audioIndex === index }"
              class="player-body-list-item"
              @click="controls.changeAudio(index)">
              {{ music.name.split('.')[0] }}
            </li>
          </template>
        </ul>
        <!-- 播放详情 - 可视化信息 -->
        <div class="player-body-detail">
          <canvas v-show="true" class="player-body-detail-visual"></canvas>
          <div v-show="false" class="player-body-detail-control">
            <!-- 滤波器 -->
            <div class="biquad control-wrap" title="滤波器">
              <div class="lowpass" @click="controls.setBiquadFilter()">低通</div>
              <div class="highpass">高通</div>
              <div class="bandpass">带通</div>
              <div class="peaking">峰值</div>
            </div>
            <!-- 混响 -->
            <div class="convolver control-wrap" title="混响"></div>
            <!-- 延迟-回声 -->
            <div class="delay control-wrap" title="延迟-回声"></div>
            <!-- 空间-3D -->
            <div class="panner control-wrap" title="空间-3D"></div>
            <!-- 线性波形变换 -->
            <div class="wave_shaper control-wrap" title="线性波形变换"></div>
            <!-- 动态范围压缩 -->
            <div class="dynamics_compressor control-wrap" title="动态范围压缩"></div>
            <!-- 声道 -->
            <div class="stereo_panner control-wrap" title="声道"></div>
          </div>
        </div>
      </div>
      <div class="player-footer">
        <div class="player-footer-info"></div>
        <div class="player-footer-control">
          <div class="control">
            <img class="loop-way control-icon" @click="controls.toggleLoopWay()" :src="loopWayIcon">
            <img class="prev control-icon" @click="controls.playPrev()" src="./assets/icon/prev.png">
            <img v-show="!isPlaying" @click="controls.play()" class="play control-icon" src="./assets/icon/play.png">
            <img v-show="isPlaying" @click="controls.pause()" class="pause control-icon" src="./assets/icon/pause.png">
            <img class="next control-icon" @click="controls.playNext()" src="./assets/icon/next.png">
            <img class="words control-icon" @click="toggleVisualType" :src="visualTypeIcon">
          </div>
          <div class="process" @mousedown="downProcess" ref="process">
            <div class="process-played" :style="{ width: playProcess }"></div>
            <div class="process-pointer" @mousedown="downPointer" :style="{ left: 'calc(' + playProcess + ' - 4px)' }"></div>
            <div class="start_time">{{ getTimeByStamp(playedTime) }}</div>
            <div class="end_time">{{ getTimeByStamp(totalTime) }}</div>
          </div>
        </div>
        <div class="player-footer-other">
          <div class="volume-process" @mousedown="downVolumeProcess" ref="volumeProcess">
            <div class="volume-process-played" :style="{ height: volumeProcess }"></div>
            <div class="volume-process-pointer" @mousedown="downVolumePointer" :style="{ top: 'calc(' + pointTop + ' - 4px)' }"></div>
          </div>
        </div>
      </div>
    </div>
    `,
  setup () {
    const instance = getCurrentInstance().proxy
    const audioIndex = ref(0)
    let isPlaying = ref(false)

    const loopWayIcon = ref('./assets/icon/sequence.png')

    // 创建播放器实例
    const player = new AudioPlayer(musicList, 'AUDIO', 'Media')
    const controls = new PlayerControls(player, { autoplay: false, initialVolume: 0.5 })
    const visual = new PlayerVisual(player, { canvasSelector: '.player-body-detail-visual', visualType: 'Spectrum' })
    window.controls = controls

    // 开始监听播放器
    watchAction()

    controls.start()

    onMounted(() => {
      // 获取进度条最左端与窗口的距离
      skewProcess = instance.$refs.process.offsetLeft
      skewVolumeProcess = instance.$refs.volumeProcess.offsetTop
      // 滚动条滚动时重新计算（进度条最左端与窗口的距离可能会发生变化）
      window.addEventListener('scroll', () => {
        skewProcess = instance.$refs.process.offsetLeft - window.scrollX
        skewVolumeProcess = instance.$refs.volumeProcess.offsetTop
      })
      volumeProcessPlayed = document.querySelector('.volume-process-played')
    })

    function watchAction() {
      /*
      * 点击播放可能会播放失败（或直接操作controls控件），所以如果直接在点击播放后修改 isPlaying 状态可能不会同步更新
      * 通过 player.watcher 通过监听audio元素的事件来通知是否播放
      * 避免播放失败的情况下播放状态未同步的问题
      * */
      player.watcher.on('loadeddata', ({ duration }) => {
        totalTime.value = duration
      })
      player.watcher.on('playing', () => {
        isPlaying.value = true
      })
      player.watcher.on('pause', () => {
        isPlaying.value = false
      })
      player.watcher.on('abort', () => {
        isPlaying.value = false
        playedTime.value = 0
        totalTime.value = 0
        playProcess.value = 0
      })
      player.watcher.on('timeupdate', ({ currentTime, duration }) => {
        const val = currentTime / duration
        playProcess.value = getPercent(val)
        playedTime.value = currentTime
      })
      player.watcher.on('volumeupdate', ({ volume }) => {
        volumeProcess.value = getPercent(volume / 1)
        pointTop.value = getPercent(1 - volume)
      })
      player.watcher.on('changePlay', ({ playIndex }) => {
        audioIndex.value = playIndex
      })
      player.watcher.on('loopWay', loopWay => {
        loopWayIcon.value = `./assets/icon/${loopWay.toLowerCase()}.png`
      })
      player.watcher.on('changeVisualType', visualType => {
        console.log(visualType, 'visualType')
        visualTypeIcon.value = `./assets/icon/${visualType}.png`
      })
    }

    const visualTypeIcon = ref('./assets/icon/Spectrum.png')
    function toggleVisualType () {
      visual.toggleVisualType()
    }

    const playProcess = ref(0) // 播放进度
    const totalTime = ref(0) // 音频总时长
    const playedTime = ref(0)
    let skewProcess = 0 // 进度条左边的相对位置
    let startOffset = 0 // 按下鼠标时鼠标的相对位置
    let skewDistance = 0 // 按下鼠标时与当前位置的距离
    let pauseBeforeStatus // 调整进度时需要暂停，用来记录调整进度之前的状态
    let isPress = false // 是否按下
    function getPercent (val) {
      return (val * 100).toFixed(1) + '%'
    }
    // 根据进度条已播放区域的距离计算当前播放进度（时间）
    function getCurrentPositionTime (offset) {
      const percent = offset / instance.$refs.process.offsetWidth
      return percent * totalTime.value
    }
    // 点击进度条调整进度
    function downProcess (event) {
      if (event.target.className === 'process-pointer') return
      const targetTime = getCurrentPositionTime(event.offsetX)
      controls.changePlayProcess(targetTime)
    }
    // 点击进度指示点
    function downPointer (event) {
      // 调整进度时暂停播放，记录播放前的状态
      pauseBeforeStatus = isPlaying.value
      controls.pause()

      isPress = true
      // 鼠标按下时修改相对位置
      startOffset = event.clientX
      skewDistance = 0

      window.onmousemove = movePointer
      window.onmouseup = () => {
        isPress = false
        // 如果调整进度前是播放中状态，继续播放
        if (pauseBeforeStatus) controls.play()
        // 然后重置状态
        pauseBeforeStatus = false
      }
    }
    // 移动进度指示点
    function movePointer (event) {
      if (!isPress) return
      skewDistance += event.movementX
      // 鼠标点击的位置 - 进度条左端距浏览器左边窗口的距离 + 鼠标当前与按下时的偏移量（正负）
      const currentPointX = startOffset - skewProcess + skewDistance
      const targetTime = getCurrentPositionTime(currentPointX)
      controls.changePlayProcess(targetTime)
    }

    const volumeProcess = ref('50%') // 当前音量
    const pointTop = ref('50%') // 计算音量指示点的位置
    let skewVolumeProcess = 0 // 进度条左边的相对位置
    let startVolumeOffset = 0 // 按下鼠标时鼠标的相对位置
    let skewVolumeDistance = 0 // 按下鼠标时与当前位置的距离
    let isVolumePress = false // 是否按下
    let volumeProcessPlayed
    // 根据进度条信息获取当前音量
    function getCurrentPositionVolume (offset, maxVolume = 1) {
      const percent = offset / instance.$refs.volumeProcess.offsetHeight
      const volume = 1 - percent
      if (volume <= 0) return 0
      if (volume >= 1) return 1
      return volume * maxVolume
    }
    // 点击音量进度条调整音量
    function downVolumeProcess (event) {
      let offsetY = event.offsetY
      // 目标对象是音量的指示点时需要修改offsetY
      if (event.target.className === 'volume-process-pointer') {
        offsetY = 50 - (volumeProcessPlayed.offsetHeight + (4 - event.offsetY))
      }
      // 目标对象是已填充的进度条时需要修改offsetY
      if (event.target.className === 'volume-process-played') {
        offsetY = 50 - (event.target.offsetHeight - offsetY)
      }
      const targetVolume = getCurrentPositionVolume(offsetY)
      controls.controlVolume(targetVolume)
    }
    // 点击音量进度指示点
    function downVolumePointer (event) {
      isVolumePress = true
      // 鼠标按下时修改相对位置
      startOffset = event.clientY
      skewDistance = 0

      window.onmousemove = moveVolumePointer
      window.onmouseup = () => {
        isVolumePress = false
      }
    }
    // 移动音量进度指示点
    function moveVolumePointer (event) {
      if (!isVolumePress) return
      skewVolumeDistance += event.movementY
      // 鼠标点击的位置 - 进度条左端距浏览器左边窗口的距离 + 鼠标当前与按下时的偏移量（正负）
      const currentPointY = startOffset - skewVolumeProcess + skewVolumeDistance
      const targetVolume = getCurrentPositionVolume(currentPointY)
      controls.controlVolume(targetVolume)
    }

    return {
      isPlaying,
      musicList,
      audioIndex,
      playProcess,
      controls,
      loopWayIcon,
      volumeProcess,
      pointTop,
      totalTime,
      playedTime,
      visualTypeIcon,

      downProcess,
      downPointer,
      downVolumeProcess,
      downVolumePointer,
      getTimeByStamp,
      toggleVisualType
    }
  }
}
const app = createApp(Component)
app.mount('#app')
