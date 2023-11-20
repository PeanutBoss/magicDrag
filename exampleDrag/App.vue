<template>
  <div class="container">
    <div class="box"></div>

    {{ state.pointMovementY }}
  </div>
</template>

<script setup>
import { useMagicDrag } from "../magicDrag";

const state = useMagicDrag(
  '.box',
  {
    skill: {
      resize: true, // 禁用放大缩小功能
      limitDragDirection: '' // 禁止X轴方向拖拽
    },
    callbacks: {
      dragCallback(dragAction, movement) {
        console.log('do something before drag')
        console.log(`竖直方向拖拽了${movement.movementY}px, 水平方向拖拽了${movement.movementX}px`)
        dragAction()
        console.log('do something after drag')
      }
  }
})
</script>

<style scoped>
.box {
  width: 200px;
  height: 200px;
  background-color: greenyellow;
}
</style>
