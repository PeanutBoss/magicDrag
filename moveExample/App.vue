<template>
  <div class="container">
    目标元素top{{ state.top.value + state.movementY.value }}<br>
    目标元素left{{ state.left.value + state.movementX.value }}<br>
    本次移动X轴偏移量{{ state.movementX }}<br>
    本次移动Y轴偏移量{{ state.movementY }}<br>
    鼠标相对目标元素的X轴方向偏移量{{ state.mouseX }}<br>
    鼠标相对目标元素的Y轴方向偏移量{{ state.mouseY }}<br>
    鼠标是否按下{{ state.isPress }}<br>
    <div class="box" ref="Box"></div>
  </div>
</template>

<script setup>
import { useMoveElement } from '../magicDrag'
const state = useMoveElement(
    '.box',
    null,
    {
      offsetLeft: 200,
      offsetTop: 100
    }
)
</script>

<style scoped>
.box {
  width: 200px;
  height: 200px;
  background-color: greenyellow;
}
</style>
