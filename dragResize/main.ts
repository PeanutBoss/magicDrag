import { createApp } from 'vue/dist/vue.esm-bundler.js'
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
    <div style="height: 800px">
      <div class="box"></div>
      <div class="box1" style="width: 100px;height: 100px;background-color: aqua;"></div>
    </div>
  `,
  setup () {
    useDragResize('.box', { minHeight: 150, pageHasScrollBar: true, skill: { resize: true, drag: false } })
    useDragResize('.box1', { minHeight: 100, minWidth: 100, pageHasScrollBar: true, skill: { resize: true, drag: true } })
  }
}

createApp(App)
  .mount('#app')
