## MagicDrag

### useMoveElement

接受一个dom元素或一个选择器使其可拖拽，接受可选的两个参数 callbacks moveOption

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

- callbacks：`Function | { move: Function, down: Function, up: Function }`
callback是一个对象或函数类型的参数
  - 当传入一个函数时，该函数作为元素被拖拽移动时的回调
  - 当传入一个对象时，该对象需要包含 move/down/up 方法，分别作为 元素移动/鼠标在元素上按下/鼠标抬起 的回调
> 当给useMoveElement传入回调参数时，useMoveElement会将 moveAction 做为回调的第一个参数，将移动的控制权交出给用户。
> movement是本次移动操作（鼠标按下到抬起的之间的动作）的偏移量。

```vue
<template>
<div class="container">
   <div class="box"></div>
</div>
</template>

<script setup>
import { useMoveElement } from 'magicDrag'
// 给callbacks传入一个函数
useMoveElement(
  '.box',
  (moveAction, movement, event) => {
    console.log(event, '事件对象')
     console.log('移动前做一些事')
     moveAction()
     console.log(`竖直方向移动了${movement.y}px, 水平方向移动了${movement.x}px`)
     console.log('移动后做一些事')
  }
)

// 给callbacks传入一个对象
useMoveElement(
        '.box',
        {
          move(moveAction, movement, event) {
            console.log(event, '事件对象')
            console.log('移动前做一些事')
            moveAction()
            console.log(`竖直方向移动了${movement.y}px, 水平方向移动了${movement.x}px`)
            console.log('移动后做一些事')
          },
          down(downAction, event) {
            console.log(event, '事件对象')
            console.log('鼠标按下前做一些事')
            downAction()
            console.log('鼠标按下后做一些事')
          },
          up(upAction, event) {
            console.log(event, '事件对象')
            console.log('与up用法相同')
            upAction()
          }
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

| 属性名        | 描述               |
|------------|------------------|
| left       | 目标元素的left值       |
| top        | 目标元素的top值        |
| movementX  | 本次移动X轴偏移量        |
| movementY  | 本次移动Y轴偏移量        |
| mouseX     | 鼠标相对目标元素的X轴方向偏移量 |
| mouseY     | 鼠标相对目标元素的Y轴方向偏移量 |
| isPress    | 鼠标是否按下           |
| destroy    | 解除绑定事件等重置操作      |

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

------

### useMagicList

接收一组DOM元素或DOM元素的描述信息，为这些DOM元素添加拖拽、缩放功能

#### 参数

 - targetSelectors: 需要给予拖拽及缩放功能的元素列表，类型为 (HTMLElement | string | SelectorDescribe)[]

```typescript
interface SelectDescribe {
  selector: string // 目标元素或目标元素的选择器
  initialPosition: Record<'left' | 'top', number> // 目标元素相对容器元素的初始位置
  initialSize: Record<'width' | 'height', number> // 目标元素的初始尺寸
}
```

 - options

| 属性                           | 描述                         | 默认值    | 可选值/类型                                             | 备注                          |
|------------------------------|----------------------------|--------|----------------------------------------------------|-----------------------------|
| containerSelector            | 容器元素的选择器，元素只能在该容器内移动       | body   | 容器元素的选择器                                           |                             |
| minWidth                     | 目标元素可以缩小的最小宽度              | 100    | number                                             |                             |
| minHeight                    | 目标元素可以缩小的最小高度              | 100    | number                                             |                             |
| maxWidth                     | 目标元素可以放大的最大宽度              | 999999 | number                                             |                             |
| maxHeight                    | 目标元素可以放大的最大高度              | 999999 | number                                             |                             |
| initialInfo.width            | 目标元素的初始宽度（如果元素本身设置了尺寸则不生效） | 200    | number                                             |                             |
| initialInfo.height           | 目标元素的初始高度（如果元素本身设置了尺寸则不生效） | 200    | number                                             |                             |
| initialInfo.left             | 目标元素的初始的X轴定位               | 0      | number                                             |                             |
| initialInfo.top              | 目标元素的初始的Y轴定位               | 0      | number                                             |                             |
| pointSize                    | 调整大小的轮廓点的尺寸（直径）            | 10     | number                                             | 即将废弃，建议通过pointStyle设置轮廓点的尺寸 |
| customClass.customPointClass | 自定义轮廓点的类名                  | -      | string                                             | 废弃                          |
| showRefLine                  | 是否显示参考线                    | true   | boolean                                            |                             |
| adsorb                       | 是否开启吸附                     | true   | boolean                                            |                             |
| gap                          | 参考线吸附的最小距离（单位px）           | 3      | number                                             |                             |
| showDistance                 | 拖拽时是否显示间距                  | true   | boolean                                            |                             |
| skill.resize                 | 是否开启调整大小功能                 | true   | boolean                                            |                             |
| skill.drag                   | 是否开启拖拽功能                   | true   | boolean                                            |                             |
| skill.limitDragDirection     | 限制目标元素拖拽方向                 | null   | 'X', 'Y'                                           |                             |
| skill.regionalSelection      | 是否开启多选（支持鼠标画框勾选和ctrl+左键）   | true   | boolean                                            |                             |
| callbacks.dragCallback       | 拖拽的回调                      | -      | (dragAction, movement, event) => void              |                             |
| callbacks.resizeCallback     | 调整大小的回调                    | -      | (resizeAction, direction, movement, event) => void |                             |
| customStyle.pointStyle       | 轮廓点的样式                     | -      | object                                             |                             |
| customStyle.tipStyle         | 间距提示的样式                    | -      | object                                             |                             |
| customStyle.refLineStyle     | 参考线的样式                     | -      | object                                             |                             |
| customStyle.selectedStyle    | 被多选选中的样式                   | -      | object                                             |                             |
| customStyle.regionStyle      | 鼠标勾选多选框的样式                 | -      | object                                             |                             |

##### 注意事项
- options.callbacks.dragCallback(options.callbacks.resizeCallback同理)
  > 目标元素被拖拽移动时执行的回调，参数为dragAction和movement，dragAction是执行移动操作的方法，在dragCallback中必须执行。
  > 当传入dragCallback回调参数时，useMagicList会将 dragAction 做为回调的第一个参数，将拖拽的控制权交出给用户。
  > movement是本次移动操作（鼠标按下到抬起的之间的动作）的偏移量。
- options.customStyle.pointStyle: width和height只支持以px为单位的值；position值必须是绝对定位
- options.customStyle.tipStyle: position值必须是绝对定位
- options.customStyle.refLineStyle: 不支持设置宽度和高度；position值必须是绝对定位

#### 返回值

| 属性名            | 描述                                   |
|----------------|--------------------------------------|
| targetLeft     | 目标元素的left值                           |
| targetTop      | 目标元素的top值                            |
| targetWidth    | 目标元素的宽度                              |
| targetHeight   | 目标元素的高度                              |
| targetIsPress  | 鼠标是否在目标元素上按下                         |
| pointIsPress   | 是否有轮廓点被按下                            |
| direction      | 按下的轮廓点所属的方向，未按下轮廓点时为null             |
| pointLeft      | 按下的轮廓点的left值，未按下轮廓点时为null            |
| pointTop       | 按下的轮廓点的top值，未按下轮廓点时为null             |
| pointMovementX | 按下的轮廓点本次移动操作在X轴方向移动的距离，选中或聚焦其他轮廓点时重置 |
| pointMovementY | 按下的轮廓点本次移动操作在Y轴方向移动的距离，选中或聚焦其他轮廓点时重置 |
| getStateList   | 获取所有元素的状态信息                          |
| getTargetState | 获取当前选中元素的状态信息                        |
| unMount        | 解除事件绑定、清空内存等操作                       |
| insertElement  | 为一个HTML元素开启拖拽功能，拖拽的配置与创建该state的配置相同  |

#### example
```vue
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
import { useMagicList } from 'magicDrag'

// 使 6 个元素可以拖拽，并对前四个设置初始尺寸和初始位置
const targetSelectors = [
  {
    selector: '.box',
    initialPosition: { left: 0, top: 0 },
    initialSize: { width: 100, height: 100 }
  },
  {
    selector: '.box1',
    initialPosition: { left: 700, top: 0 },
    initialSize: { width: 100, height: 100 }
  },
  {
    selector: '.box2',
    initialSize: { width: 100, height: 100 },
    initialPosition: { left: 0, top: 700 }
  },
  {
    selector: '.box3',
    initialPosition: { left: 700, top: 700 },
    initialSize: { width: 100, height: 100 }
  },
  '.box4', '.box5'
]

const state = useMagicList(
  targetSelectors,
  {
    minHeight: 200,
    minWidth: 200,
    containerSelector: '.wrap',
    initialInfo: { left: 300, top: 300 },
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
      },
      selectedStyle: {
        outline: '1px solid black'
      },
      regionStyle: {
        position: 'absolute',
        border: '1px solid aqua',
        zIndex: '88888',
        backgroundColor: 'rgba(0, 255, 255, 0.1)'
      }
    }
  }
)

</script>
 ```


### 欢迎贡献

欢迎和鼓励开发者们为这个项目做出贡献。无论是报告Bug、提交功能请求，还是编写文档和修复问题，您的帮助都将使这个项目变得更好。

邮箱地址：2236402130@qq.com

