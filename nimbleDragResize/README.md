## DragResize

### useMovePoint

_接受一个dom元素或一个选择器（selector）使其可拖拽，接受可选的两个参数 moveCallback & limitDirection_

#### 参数

 - selector：目标元素或目标元素的选择器

 - moveCallback：元素被拖拽移动时执行的回调，参数为moveAction，移动时必须执行
  ```ts
  useMovePoint(selector, moveCallback)

  function moveCallback (moveAction) {
    // do something
    moveAction()
    // do something
  }
  ```

 - limitDirection：元素在X / Y轴是否可以移动，可选值'X'/'Y'（会限制更新鼠标移动的距离）
  ```ts
  // 不允许在X轴移动，不传不限制
  useMovePoint(selector, null, 'X')
  ```

#### 返回值

 - canIMove：可以控制元素是否可以移动（不会限制更新鼠标移动的距离）
 - isPress：鼠标是否在selector元素上按下（是否处于可移动状态）
 - movementX/Y：鼠标移动的距离
 - left/top：鼠标在selector元素上按下时元素的坐标
 - preStartX/Y：鼠标在selector元素上按下时元素的坐标

### useDragResize

_接受一个元素/选择器作为参数，使其可以被拖拽放大缩小_

#### 参数

 - selector：目标元素或目标元素的选择器

### STYLE
 除zIndex外通过添加类名的方式处理

#### zIndex
 - 轮廓点（4） 88888
 - 元素（一般状态）（2）66666
 - 元素（锁定状态）（1）55555
 - 元素（选中状态）（3）77777
 - menuBox（5） 99999

#### opacity
 - 锁定
 - 拖拽中

#### options
 - 轮廓点样式（不能直接设置尺寸）
   - 设置单个元素（优先）
   - 设置所有元素
 - 选中样式
 - 锁定样式
 - menuBox样式
 - menuBoxItem样式

