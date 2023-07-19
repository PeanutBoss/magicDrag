import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'
import useDragResize from './useDragResize.ts'

const App = {
  template: `
    <div v-if="false">
      <h2>left-top: {{ left }} - {{ top }}</h2>
      <hr>
      <h2>x-y: {{ movementX }} - {{ movementY }}</h2>
      <hr>
      <div class="point"></div>
    </div>
    <div class="wrap" style="height: 800px">
      {{ state.targetIsPress }}<br>
      {{ state.targetLeft }} - {{ state.targetTop }}<br>
      {{ state.targetWidth }} - {{ state.targetHeight }}<br>
      <hr>
      {{ state.pointLeft }} - {{ state.pointTop }}<br>
      {{ state.direction }} - {{ state.pointIsPress }}<br>
      {{ state.pointMovementX }} - {{ state.pointMovementY }}
      <hr>
      <div class="box"></div>
<!--      <div class="box1" style="width: 100px;height: 100px;background-color: aqua;"></div>-->
<!--      <div class="box2" style="width: 100px;height: 100px;background-color: orange;"></div>-->
    </div>
  `,
  setup () {
    const state = useDragResize('.box', { minHeight: 150, pageHasScrollBar: true, containerSelector: '.wrap' })

    // const targetCoordinate: any = useDragResize('.box1', {
    //   minHeight: 100,
    //   minWidth: 100,
    //   pageHasScrollBar: true,
    //   skill: { resize: true, drag: true },
    //   callbacks: {
    //     dragCallback(moveTargetAction, direction) {
    //       moveTargetAction()
    //     },
    //     resizeCallback(resizeTargetAction, direction, movement) {
    //       resizeTargetAction()
    //     }
    //   }
    // })

    // useDragResize('.box2', { pageHasScrollBar: true, skill: { limitDragDirection: 'Y' } })
    return {
      state
    }
  }
}

createApp(App)
  .mount('#app')
