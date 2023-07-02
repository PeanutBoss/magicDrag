import { AudioPlayer, PlayerControls, PlayerVisual } from './playerVisual'
import { getMusicList }  from './musicNameList'
import { getTimeByStamp } from './tool'
import { createApp, onMounted, ref, reactive, getCurrentInstance, watch } from 'vue/dist/vue.esm-bundler.js'
import useMovePointer from '../movePointer/hook.ts'
import {watchEffect} from "vue";
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
          <div class="process">
            <div class="process-played"></div>
            <div class="process-pointer"></div>
            <div class="start_time">{{ getTimeByStamp(playedTime) }}</div>
            <div class="end_time">{{ getTimeByStamp(totalTime) }}</div>
          </div>
        </div>
        <div class="player-footer-other">
          <div class="volume-process">
            <div class="volume-process-played" ></div>
            <div class="volume-process-pointer"></div>
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

		// 开始监听播放器
		watchAction()

		controls.start()

		// onMounted(() => {
		// 	// 获取进度条最左端与窗口的距离
		// 	skewVolumeProcess = (instance.$refs.volumeProcess as any).offsetTop
		// 	// 滚动条滚动时重新计算（进度条最左端与窗口的距离可能会发生变化）
		// 	window.addEventListener('scroll', () => {
		// 		skewVolumeProcess = (instance.$refs.volumeProcess as any).offsetTop
		// 	})
		// 	volumeProcessPlayed = document.querySelector('.volume-process-played')
		// })

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
			})
			player.watcher.on('timeupdate', ({ currentTime, duration }) => {
				playedTime.value = currentTime
        currentPosition.value = currentTime ? currentTime / totalTime.value * totalSize.value : 0
			})
			player.watcher.on('volumeupdate', ({ volume }) => {
        volumePosition.value = volume / 1 * volumeSize.value
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

		const totalTime = ref(0) // 音频总时长
		const playedTime = ref(0)
		let startOffset = 0 // 按下鼠标时鼠标的相对位置
		let skewDistance = 0 // 按下鼠标时与当前位置的距离
		let pauseBeforeStatus // 调整进度时需要暂停，用来记录调整进度之前的状态

    const {
      currentPosition,
      totalSize,
      pressState
    } = useMovePointer({
      process: '.process',
      processPlayed: '.process-played',
      processPointer: '.process-pointer',
      direction: 'ltr'
    })
    // 通过监听是否按下指示点判断是否更新播放进度
    watch(pressState, ({ processState, playedPress, pointPress }) => {
      controls.changePlayProcess(currentPosition.value / totalSize.value * totalTime.value)
      controls[pointPress ? 'pause' : 'play']()
    })
    watchEffect(() => {
      playedTime.value = currentPosition.value / totalSize.value * totalTime.value
    }, { flush: 'post' })

    const {
      currentPosition: volumePosition,
      totalSize: volumeSize,
      pressState: volumeState
    } = useMovePointer({
      process: '.volume-process',
      processPlayed: '.volume-process-played',
      processPointer: '.volume-process-pointer',
      direction: 'btt',
      moveCallBack (event) {
        controls.controlVolume(volumePosition.value / volumeSize.value)
      }
    })
    watch(volumeState, () => {
      controls.controlVolume(volumePosition.value / volumeSize.value)
    })

		return {
			isPlaying,
			musicList,
			audioIndex,
			controls,
			loopWayIcon,
			totalTime,
			playedTime,
			visualTypeIcon,

			getTimeByStamp,
			toggleVisualType
		}
	}
}
const app = createApp(Component)
app.mount('#app')
