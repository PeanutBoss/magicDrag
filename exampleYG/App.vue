<template>
  <div class="yg-main">
    <div ref="wrap" class="yg-wrap">
      <div class="yg-container">
        <div class="yg-container-canvas" :style="{transform: `scale(${canvasRatio}) translate(-50%, -50%)`}">
          <div class="box" style="width: 100px; height: 100px; background-color: blueviolet"></div>
<!--          <div class="box2" style="width: 100px; height: 100px; background-color: skyblue"></div>-->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useMagicList } from '../magicDrag'

const wrap = ref(null)
const canvasRatio = ref(1)

onMounted(() => {
  wrap.value.addEventListener('wheel', handleWheel)
  wrap.value.scrollTo({
    top: 640,
    left: 1180,
  })
  nextTick(() => {
    useMagicList(['.box'], {
      containerSelector: '.yg-container-canvas'
    })
  })
})

function handleWheel(event) {
  if (!event.ctrlKey) return
  event.preventDefault()
  canvasRatio.value += event.deltaY > 0 ? -0.05 : 0.05
  console.log(canvasRatio.value)
}

</script>

<style scoped>
.yg-main {
  position: relative;
  height: 100%;
  width: calc(100% - 404px);
  background-color: #323232;
}
.yg-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
}
.yg-wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.yg-wrap::-webkit-scrollbar-thumb {
  background-color: rgba(247, 247, 247, 0.15);
  border-radius: 4px;
}
.yg-wrap::-webkit-scrollbar-track {
  background-color: #232323;
  border-radius: 4px;
}
.yg-wrap::-webkit-scrollbar-corner {
  background-color: #232323;
}
.yg-container {
  position: absolute;
  width: 3840px;
  height: 2160px;
}
.yg-container-canvas {
  transform-origin: 0 50%;
  position: absolute;
  width: 960px;
  height: 540px;
  border-radius: 4px;
  background: #393939;
  box-shadow: 3px 3px 50px rgba(34, 34, 34, 0.86);
  left: 50%;
  top: 50%;
}
.yg-x-ruler {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 18px;
  background-color: #282828;
}
.yg-y-ruler {
  position: absolute;
  top: 0;
  left: 0;
  width: 18px;
  height: 100%;
  background-color: #282828;
}
.yg-pointer-ruler {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
}
/*# sourceMappingURL=Main.css.map */

</style>
