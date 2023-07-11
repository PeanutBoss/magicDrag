import { createApp } from 'vue/dist/vue.esm-bundler.js'
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
    const { left, top, movementX, movementY, canIMove } = useMovePoint(
      '.point',
      moveAction => {
        // canIMove.x = false
        moveAction()
      },
      {
        direction: 'X'
      //   updateX: false
      }
      )
    return { left, top, movementX, movementY }
  }
}

createApp(App)
  .mount('#point_app')
