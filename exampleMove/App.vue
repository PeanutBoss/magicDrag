<template>
  <div class="container">
    目标元素top{{ state.top.value }}<br>
    目标元素left{{ state.left.value }}<br>
    本次移动X轴偏移量{{ state.movementX }}<br>
    本次移动Y轴偏移量{{ state.movementY }}<br>
    鼠标相对目标元素的X轴方向偏移量{{ state.mouseX }}<br>
    鼠标相对目标元素的Y轴方向偏移量{{ state.mouseY }}<br>
    鼠标是否按下{{ state.isPress }}<br>
    相对容器元素变化的偏移量：{{ state.relContainerX }} - {{ state.relContainerY }}
<!--    <input type="text" v-model.number="state.movementX.value">-->
    <div class="box" ref="Box"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useMoveElement } from '../magicDrag'
const state = useMoveElement(
    '.box',
    null,
    {
      offsetLeft: 200,
      offsetTop: 100
    }
)
// 卸载组件实例时销毁state
onBeforeUnmount(state.destroy)
</script>

<style scoped>
.box {
  width: 200px;
  height: 200px;
  background-color: greenyellow;
  position: absolute;
  left: 150px;
}
.container {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>
