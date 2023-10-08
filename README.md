## MagicResize

### useMoveElement

_接受一个dom元素或一个选择器（selector）使其可拖拽，接受可选的两个参数 moveCallback moveOption_

#### 参数

- selector：目标元素的选择器
```vue
<template>
  <div class="container">
    <div class="box"></div>
  </div>
</template>

<script setup>
import { useMoveElement } from 'magicDrag'
useMoveElement('.box')
</script>
```
- selector：目标元素
```vue
<template>
  <div class="container">
   <div class="box"></div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import { useMoveElement } from 'magicDrag'
const Box = ref(null)
onMounted(() => {
  useMoveElement(Box.value)
})
</script>
```

- moveCallback：元素被拖拽移动时执行的回调，参数为moveAction和movement，moveAction移动时必须执行
> 当给useMoveElement传入回调参数时，useMoveElement会将 moveAction 做为回调的第一个参数，将移动的控制权交出给用户
> （moveAction是执行移动操作的方法）。movement是本次移动操作（鼠标按下到抬起）的偏移量。

```vue
<template>
<div class="container">
   <div class="box"></div>
</div>
</template>

<script setup>
import { useMoveElement } from 'magicDrag'
useMoveElement(
  '.box',
  (moveAction, movement) => {
     console.log('移动前做一些事')
     moveAction()
     console.log(`竖直方向移动了${movement.y}px, 水平方向移动了${movement.x}px`)
     console.log('移动后做一些事')
  }
)
</script>
```

- moveOption：
    - limitDirection: 限制X/Y轴方向的拖拽，可选值'X' | 'Y', null不限制
    - throttleTime: 节流时间 默认10ms（提示：太大可能导致拖拽不平滑）
    - offsetLeft: X轴偏移量，限制X轴方向目标元素距离body的位置
    - offsetTop: Y轴偏移量，与offsetLeft同理
```vue
<template>
  <div class="container">
    <div class="box" ref="Box"></div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import { useMoveElement } from 'magicDrag'
const Box = ref(null)
onMounted(() => {
  useMoveElement(
    Box.value,
    null,
    { limitDirection: 'X' }
  )
})
</script>
```

```vue
<template>
  <div class="container">
    <div class="box" ref="Box"></div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import { useMoveElement } from 'magicDrag'
const Box = ref(null)
onMounted(() => {
  useMoveElement(
    Box.value,
    null,
    {
      offsetLeft: 200,
      offsetTop: 100
    }
  )
})
</script>
```
![offset.png](..%2Foffset.png)

#### 返回值
```vue
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
import { useMoveElement } from 'magicDrag'
const state = useMoveElement(
    '.box',
    null,
    {
      offsetLeft: 200,
      offsetTop: 100
    }
)
</script>
```



### useMagicDrag
