<template>
  <div class="container">
    <div class="wrap" style="position:relative;">
      <div class="box"></div>
      <div class="box1"></div>
      <div class="box2"></div>
<!--      <div class="box3"></div>-->
<!--      <div class="box4"></div>-->
<!--      <div class="box5"></div>-->
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useMagicList } from '../magicDrag'

const targetSelectors = [
  {
    selector: '.box',
    initialPosition: { left: 200, top: 200 },
    initialSize: { width: 100, height: 100 }
  },
  {
    selector: '.box1',
    // initialPosition: { left: 700, top: 0 },
    initialSize: { width: 100, height: 100 }
  },
  {
    selector: '.box2',
    initialSize: { width: 170, height: 180 },
    initialPosition: { left: 475, top: 475 }
  },
  // {
  //   selector: '.box3',
  //   // initialPosition: { left: 700, top: 700 },
  //   initialSize: { width: 100, height: 100 }
  // },
  // '.box4', '.box5'
]

const state = useMagicList(
  targetSelectors,
  {
    minHeight: 100,
    minWidth: 100,
    maxWidth: 256,
    maxHeight: 256,
    containerSelector: '.wrap',
    initialInfo: { left: 0, top: 0 },
    customClass: {},
    gap: 10,
    skill: {
      regionalSelection: true
    },
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

onBeforeUnmount(state.unMount)

</script>

<style scoped>
.box {
  background-color: greenyellow;
}
.wrap {
  margin-left: 100px;
  margin-top: 100px;
  width: 800px;
  height: 800px;
  padding: 0 1px 1px 0;
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
