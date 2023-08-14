import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'
import useMagicDrag from './useMagicDrag.ts'
import "./style/index.scss"

const imgSource = ref(null)
// @ts-ignore
import('./assets/image/suolong.png').then(res => {
  imgSource.value = res.default
})

const App = {
  template: `
    <div class="wrap" style="height: 800px">
      {{ state.targetIsPress }}<br>
      {{ state.targetLeft }} - {{ state.targetTop }}<br>
      {{ state.targetWidth }} - {{ state.targetHeight }}<br>
      <hr>
      {{ state.pointLeft }} - {{ state.pointTop }}<br>
      {{ state.direction }} - {{ state.pointIsPress }}<br>
      {{ state.pointMovementX }} - {{ state.pointMovementY }}<br>
      {{ state.targetIsLock }}
      <hr>
      <img :src="imgSource" class="box">
      <div class="box1" style="width: 100px;height: 100px;background-color: aqua;"></div>
<!--      <div class="box2" style="width: 100px;height: 100px;background-color: orange;"></div>-->
    </div>
  `,
  setup () {
    let pressShift = false
    window.addEventListener('keydown', event => {
      pressShift = event.key === 'Shift'
    })
    window.addEventListener('keyup', () => {
      pressShift = false
    })
    const state = useMagicDrag(
      '.box',
      {
        minHeight: 200,
        minWidth: 300,
        // maxWidth: 600,
        // maxHeight: 400,
        pageHasScrollBar: true,
        containerSelector: 'body',
        callbacks: {
          // dragCallback (moveAction) {
          //   pressShift && moveAction()
          // }
        },
        customClass: {},
        contextMenuOption: {}
      }
    )

    useMagicDrag('.box1', { containerSelector: '.wrap' })

    // useMagicDrag('.box2', { pageHasScrollBar: true, skill: { limitDragDirection: 'Y' } })
    return {
      state,
      imgSource
    }
  }
}

createApp(App)
  .mount('#app')
