import { createApp, onMounted } from 'vue/dist/vue.esm-bundler.js'
import { getOppositeSide, getAdjacentSide, getHypotenuseSide } from './toosl.ts'
import useMovePoint from './useMovePoint.ts'
import useDragResize from "./useDragResize.ts";

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
    // const { left, top, movementX, movementY } = useMovePoint('.point')
    // return { left, top, movementX, movementY }
    useDragResize('.box')
  }
}

createApp(App)
  .mount('#app')
