import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'
import { useMagicDrag } from '../magicDrag'
import "./style/index.scss"

const imgSource = ref(null)
// @ts-ignore
import('./assets/image/lufei.png').then(res => {
  imgSource.value = res.default
})

const App = {
  template: `
    <div>
      <div class="placeholder-top"></div>
      <div style="display: flex;width: 100%">
        <div class="placeholder-left"></div>
        <div class="wrap" style="height: 800px;width: 800px">
          {{ state.pointMovementX }} {{ state.pointMovementY }}<br>
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
          <div class="box1" style="background-color: aqua;"></div>
          <div class="box2" style="width: 100px;height: 100px;background-color: orange;"></div>
        </div>
      </div>
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
        minWidth: 200,
        // maxWidth: 600,
        // maxHeight: 400,
        // pageHasScrollBar: true,
        containerSelector: '.wrap',
        callbacks: {
          // dragCallback (moveAction) {
          //   pressShift && moveAction()
          // }
        },
        initialInfo: { left: 300, top: 500 },
        customClass: {},
        customStyle: {
          tipStyle: {
            width: '50px'
          }
        }
      }
    )

    useMagicDrag('.box1',
      {
        containerSelector: 'body',
        initialInfo: {
          width: 100,
          height: 100,
          left: 200,
          top: 100
        },
        customStyle: {
          tipStyle: {
            width: '50px'
          }
        }
      })

    // useMagicDrag(
    //   '.box2',
    //   {
    //     containerSelector: '.wrap',
    //     initialInfo: { top: 700, left: 700 },
    //     customStyle: {}
    //   }
    // )
    return {
      state,
      imgSource
    }
  }
}

createApp(App)
  .mount('#app')
