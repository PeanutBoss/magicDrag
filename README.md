## MagicResize

### useMoveElement

接受一个dom元素或一个选择器使其可拖拽，接受可选的两个参数 moveCallback moveOption

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

- moveCallback：元素被拖拽移动时执行的回调，参数为moveAction和movement，moveAction是执行移动操作的方法，在moveCallback中必须执行。
> 当给useMoveElement传入回调参数时，useMoveElement会将 moveAction 做为回调的第一个参数，将移动的控制权交出给用户。
> movement是本次移动操作（鼠标按下到抬起）的偏移量。

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
![offset.png](offset.png)

#### 返回值

| 属性名        | 描述                      |
|------------|-------------------------|
| left       | 目标元素的left值              |
| top        | 目标元素的top值               |
| movementX  | 本次移动X轴偏移量               |
| movementY  | 本次移动Y轴偏移量               |
| mouseX     | 鼠标相对目标元素的X轴方向偏移量        |
| mouseY     | 鼠标相对目标元素的Y轴方向偏移量        |
| isPress    | 鼠标是否按下                  |
| destroy    | 解除绑定事件等                 |

```vue
<template>
  <div class="container">
    {{ state.top.value + state.movementY.value }}<br>
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
import { onBeforeUnmount } from 'vue'
import { useMoveElement } from 'magicDrag'
const state = useMoveElement(
    '.box',
    null,
    {
      offsetLeft: 200,
      offsetTop: 100
    }
)
// 卸载组件实例时解绑useMoveElement的事件
onBeforeUnmount(state.destroy)
</script>
```



### useMagicDrag

接受一个dom元素或一个选择器使其可拖拽和调整大小

#### 参数

 - targetSelector: 选择器
```vue
<template>
  <div class="container">
    <div class="box"></div>
  </div>
</template>

<script setup>
import { useMagicDrag } from 'magicDrag'

useMagicDrag('.box')

</script>
 ```

- options

| 属性                           | 描述                   | 默认值   |
|------------------------------|----------------------|-------|
| containerSelector            | 容器元素的选择器，元素只能在该容器内移动 | body  |
| minWidth                     | 容器可以缩放的最小宽度          | 100   |
| minHeight                    | 容器可以缩放的最小高度          | 100   |
| maxWidth                     | 容器可以放大的最大宽度          | 999999 |
| maxHeight                    | 容器可以放大的最大高度          | 999999 |
| pointSize                    | 调整大小的轮廓点的尺寸（直径）      | 10    |
| customClass.customPointClass | 自定义轮廓点的类名            |       |
| skill.resize                 | 是否开启调整大小功能           |       |
| skill.drag                   | 是否开启拖拽功能             |       |
| skill.limitDragDirection     | 限制目标元素拖拽方向           |       |
| callbacks.dragCallback       | 拖拽的回调                |       |
| callbacks.resizeCallback     | 调整大小的回调              |       |
