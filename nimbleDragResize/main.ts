import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'
import useDragResize from './useDragResize.ts'
import ContextMenu from './plugins/contextMenu.ts'
import "./style/index.css"

const imgSource = ref(null)
// @ts-ignore
import('./assets/image/suolong.png').then(res => {
  console.log(res.default)
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
<!--      <div class="box1" style="width: 100px;height: 100px;background-color: aqua;"></div>-->
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
    const state = useDragResize(
      '.box',
      {
        minHeight: 150,
        // maxWidth: 600,
        // maxHeight: 400,
        pageHasScrollBar: true,
        containerSelector: '.wrap',
        callbacks: {
          // dragCallback (moveAction) {
          //   pressShift && moveAction()
          // }
        }
      },
      [ContextMenu]
    )

    // const targetCoordinate: any = useDragResize('.box1', { containerSelector: '.wrap' }, [ContextMenu, Drag, Resize])

    // useDragResize('.box2', { pageHasScrollBar: true, skill: { limitDragDirection: 'Y' } })
    return {
      state,
      imgSource
    }
  }
}

createApp(App)
  .mount('#app')
