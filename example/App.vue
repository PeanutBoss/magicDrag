<template>
  <div class="container">
    <div class="box"></div>
  </div>
</template>

<script setup>
import { useMagicDrag } from "../magicDrag";

useMagicDrag('.box', {})

</script>

<style scoped>
.box {
  width: 200px;
  height: 200px;
  background-color: greenyellow;
}
</style>
