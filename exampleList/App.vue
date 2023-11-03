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
  </div>
</template>

<script setup>
import { useMagicList } from '../magicDrag'
const targetSelectors = [
  {
    selector: '.box',
    initialPosition: { width: 200, height: 200 },
    initialSize: { left: 0, top: 0 }
  },
  {
    selector: '.box1'
  },
  '.box2', '.box3', '.box4', '.box5'
]

const state = useMagicList(
  targetSelectors,
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
  margin-left: 100px;
  margin-top: 100px;
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
