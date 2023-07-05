import { createApp, onMounted } from 'vue/dist/vue.esm-bundler.js'
import { getOppositeSide, getAdjacentSide, getHypotenuseSide } from './toosl.ts'
import useMovePoint from './useMovePoint.ts'

const App = {
  template: `
    <div>
      <h2>left-top: {{ left }} - {{ top }}</h2>
      <hr>
      <h2>x-y: {{ movementX }} - {{ movementY }}</h2>
      <hr>
      <div class="point"></div>
    </div>
  `,
  setup () {
    const { left, top, movementX, movementY } = useMovePoint('.point')
    return { left, top, movementX, movementY }
  }
}

createApp(App)
  .mount('#app')
