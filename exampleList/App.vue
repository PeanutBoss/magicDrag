<template>
  <div class="container">
    <div class="wrap">
      <div class="box"></div>
      <div class="box1"></div>
      <div class="box2"></div>
      <div class="box3"></div>
      <div class="box4"></div>
      <div class="box5"></div>
    </div>

    {{ state.targetIsPress }}
  </div>
</template>

<script setup>
import { useMagicList } from '../magicDrag'
const state = useMagicList(
  ['.box', '.box1', '.box2', '.box3', '.box4', '.box5'],
  {
    minHeight: 200,
    minWidth: 200,
    containerSelector: '.wrap',
    initialInfo: { left: 300, top: 500 },
    customClass: {},
    gap: 10,
    customStyle: {
      tipStyle: {
        width: '34px',
        height: '18px',
        backgroundColor: 'skyblue',
        color: 'purple'
      },
      pointStyle: {
        width: '6px'
      },
      refLineStyle: {
        backgroundColor: 'yellowgreen'
      }
    }
  }
)
</script>

<style scoped>
.box {
  width: 200px;
  height: 200px;
  background-color: greenyellow;
}
.wrap {
  width: 800px;
  height: 800px;
  background-color: #cccccc;
}
.box1 {
  background-color: orange;
}
.box2 {
  background-color: mediumaquamarine;
}
.box3 {
  background-color: blueviolet;
}
.box4 {
  background-color: skyblue;
}
.box5 {
  background-color: khaki;
}
</style>
