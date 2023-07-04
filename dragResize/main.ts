import { createApp, onMounted } from 'vue/dist/vue.esm-bundler.js'
import { getOppositeSide, getAdjacentSide, getHypotenuseSide } from './toosl.ts'
import {reactive, ref} from "vue";

const App = {
  template: `
    <div>
      <div class="point" @mousedown="mouseDown"></div>
    </div>
  `,
  setup () {
    onMounted(() => {
      $point = document.querySelector('.point')
      console.log($point)
    })

    let $point
    const isPress = ref(false)
    // 按下鼠标时鼠标的坐标
    const startOffset = reactive({
      x: 0,
      y: 0
    })
    // 按下鼠标时元素的坐标
    const startCoordinate = reactive({
      x: 0,
      y: 0
    })
    function mouseDown (event) {
      isPress.value = true
      startCoordinate.x = $point.offsetLeft
      startCoordinate.y = $point.offsetTop
      startOffset.x = event.pageX
      startOffset.y = event.pageY
      window.onmousemove = mouseMove
      window.onmouseup = mouseUp
    }
    function mouseMove (event) {
      if (!isPress.value) return
      console.log(event.pageX - startOffset.x, $point.offsetLeft)
      $point.style.left = startCoordinate.x + event.pageX - startOffset.x + 'px'
      $point.style.top = startCoordinate.y + event.pageY - startOffset.y + 'px'
    }
    function mouseUp () {
      isPress.value = false
    }
    return {
      mouseDown,
      mouseMove,
      mouseUp
    }
  }
}

createApp(App)
  .mount('#app')
