import { createApp } from 'vue/dist/vue.esm-bundler.js'
import useMovePoint from './useMovePoint.ts'
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
    </div>
  `,
  setup () {
    useDragResize('.box', { minHeight: 200, minWidth: 200 })
  }
}

createApp(App)
  .mount('#app')
