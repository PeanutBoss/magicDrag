import { getElement } from "../utils/tools.ts";
import { onMounted, reactive, watch } from 'vue/dist/vue.esm-bundler.js'
import useMovePoint from "./useMovePoint.ts";

/*
* TODO 注释
*  1.初始化目标元素
*  2.初始化/移动轮廓点
*  3.移动目标元素
* */

export default function useDragResize (targetSelector: string | HTMLElement) {
	onMounted(() => {
		initTarget()

    createDragPoint($target, 10)
	})

  let $target
  const initialTarget = reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })
	function initTarget () {
		$target = getElement(targetSelector)
    const { left, top, height, width } = $target.getBoundingClientRect()
    const rect = {
      // 处理页面滚动的距离
      left: left + window.scrollX,
      top: top + window.scrollY,
      height,
      width
    }
    for (const rectKey in initialTarget) {
      initialTarget[rectKey] = rect[rectKey]
    }
	}

  /*
  * FIXME 边界问题 最小尺寸限制
  * */
  const pointElements = {
    lt: null,
    lb: null,
    rt: null,
    rb: null,
    t: null,
    b: null,
    l: null,
    r: null
  }
  // 移动不同轮廓点的策略
  const pointStrategies = {
    lt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.top = top + offsetY + 'px'
      target.style.width = width - offsetX + 'px'
      target.style.height = height - offsetY + 'px'
    },
    lb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.width = width - offsetX + 'px'
      target.style.height = height + offsetY + 'px'
    },
    rt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.top = top + offsetY + 'px'
      target.style.width = width + offsetX + 'px'
      target.style.height = height - offsetY + 'px'
    },
    rb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.width = width + offsetX
      target.style.height = height + offsetY
    },
    t (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.top = top + offsetY + 'px'
      target.style.height = height - offsetY + 'px'
    },
    b (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.height = height + offsetY
    },
    l (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.width = width - offsetX + 'px'
    },
    r (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.width = width + offsetX + 'px'
    }
  }
  // $target 尺寸/坐标 更新后，获取最新轮廓点坐标的策略
  const paramStrategies = {
    lt ({ left, top, width, height, movementX, movementY }) {
      return {
        left: left + movementX.value,
        top: top + movementY.value,
        width: width - movementX.value,
        height: height - movementY.value
      }
    },
    lb ({ left, top, width, height, movementX, movementY }) {
      return {
        left: left + movementX.value,
        top,
        width: width - movementX.value,
        height: height + movementY.value
      }
    },
    rt ({ left, top, width, height, movementX, movementY }) {
      return {
        left,
        top: top + movementY.value,
        width: width + movementX.value,
        height: height - movementY.value
      }
    },
    rb ({ left, top, width, height, movementX, movementY }) {
      return {
        left,
        top,
        width: width + movementX.value,
        height: height + movementY.value
      }
    },
    t ({ left, top, width, height, movementX, movementY }) {
      return {
        left,
        top: top + movementY.value,
        width,
        height: height - movementY.value
      }
    },
    b ({ left, top, width, height, movementX, movementY }) {
      return {
        left,
        top,
        width,
        height: height + movementY.value
      }
    },
    l ({ left, top, width, height, movementX, movementY }) {
      return {
        left: left + movementX.value,
        top,
        width: width - movementX.value,
        height
      }
    },
    r ({ left, top, width, height, movementX, movementY }) {
      return {
        left,
        top,
        width: width + movementX.value,
        height
      }
    }
  }

  // 创建供拖拽的元素
  function createDragPoint (target: HTMLElement, pointSize: number) {
    const parentNode = target.parentNode
    const pointPosition = createParentPosition(initialTarget, pointSize)
    for (const direction in pointPosition) {
      const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
      point.style.position = 'absolute'
      point.style.width = pointSize + 'px'
      point.style.height = pointSize + 'px'
      setPosition(point, pointPosition, direction)
      point.style.cursor = pointPosition[direction][2]
      point.style.boxSizing = 'border-box'
      point.style.border = '1px solid #333'
      point.style.borderRadius = '50%'
      point.style.display = 'none'
      parentNode.appendChild(point)

      bindEvent(target)

      const { isPress, movementX, movementY, canIMove } = useMovePoint(point, (moveAction) => {
        moveAction()
        movePointCallback({ target, direction, movementX, movementY, pointSize, canIMove })
      }, pointPosition[direction][3])

      // 松开鼠标时更新宽高信息
      watch(isPress, () => {
        if (!isPress.value) {
          initialTarget.width = target.offsetWidth
          initialTarget.height = target.offsetHeight
          initialTarget.left = target.offsetLeft
          initialTarget.top = target.offsetTop
        }
      })
    }
  }

  // TODO movementX/Y 与 x/y 一样
  function movePointCallback ({ target, direction, movementX, movementY, pointSize, canIMove }) {// 根据按下点的移动信息 调整元素尺寸和定位

    const { left, top, width, height } = initialTarget
    // 是否达到可移动的最大距离
    const achieveMaxX = width - movementX.value <= 100
    const achieveMaxY = height - movementY.value <= 100
    // 是否达到最小宽度/高度
    const achieveMinWidth = width <= 100 && movementX.value > 0
    const achieveMinHeight = height <= 100 && movementY.value > 0
    // 如果已经达到可移动的最大距离则不能移动
    canIMove.x = !achieveMaxX
    canIMove.y = !achieveMaxY

    if (achieveMaxX || achieveMaxY && (!achieveMinWidth || !achieveMinHeight)) {
      if (achieveMaxX) {
        movementX.value = 100
      }
      if (achieveMaxY) {
        movementY.value = 100
      }
    }
    if (achieveMinWidth || achieveMinHeight) {
      if (achieveMinWidth) {
        movementX.value = 0
      }
      if (achieveMinHeight) {
        movementY.value = 0
      }
    }

    pointStrategies[direction](target, {
      left: initialTarget.left,
      top: initialTarget.top,
      width: initialTarget.width,
      height: initialTarget.height,
      offsetX: movementX.value,
      offsetY: movementY.value
    })

    // 获取 target 最新坐标和尺寸信息，按下不同点时计算坐标和尺寸的策略不同
    const coordinate = paramStrategies[direction]({ ...initialTarget, movementX, movementY })
    // 根据新的坐标和尺寸信息设置轮廓点的位置
    const pointPosition = createParentPosition(coordinate, pointSize)
    for (const innerDirection in pointPosition) {
      // 不需要更新当前拖拽的点
      if (innerDirection === direction) continue
      // 设置 innerDirection 对应点的位置信息
      setPosition(pointElements[innerDirection], pointPosition, innerDirection)
    }
  }

  // TODO contains
  function bindEvent (target: HTMLElement) {
    // 使元素可以进行焦点设置，但不会参与默认的焦点顺序
    target.tabIndex = -1
    // target.onblur = blur
    // 用来记录按下 target 时各个轮廓点的位置信息
    const downPointPosition = {}
    const { isPress, movementY, movementX } = useMovePoint(target, (moveAction) => {
      moveAction()
      for (const key in pointElements) {
        pointElements[key].style.left = downPointPosition[key][0] + movementX.value + 'px'
        pointElements[key].style.top = downPointPosition[key][1] + movementY.value + 'px'
      }
    })
    watch(isPress, () => {
      if (isPress.value) {
        mousedown()
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    })
  }
  function mousedown() {
    for (const key in pointElements) {
      pointElements[key].style.display = 'block'
    }
  }
  function blur (event) {
    console.log(event.target)
    for (const key in pointElements) {
      pointElements[key].style.display = 'none'
    }
  }

  function setPosition (point: HTMLElement, pointPosition, direction) {
    point.style.left = pointPosition[direction][0] + 'px'
    point.style.top = pointPosition[direction][1] + 'px'
  }

  function createParentPosition ({ left, top, width, height }, pointSize: number) {
    const halfPointSize = pointSize / 2
    return {
      lt: [left - halfPointSize, top - halfPointSize, 'nw-resize'],
      lb: [left - halfPointSize, top + height - halfPointSize, 'ne-resize'],
      rt: [left + width - halfPointSize, top - halfPointSize, 'ne-resize'],
      rb: [left + width - halfPointSize, top + height - halfPointSize, 'nw-resize'],
      t: [left + width / 2 - halfPointSize, top - halfPointSize, 'n-resize', 'X'],
      b: [left + width / 2 - halfPointSize, top + height - halfPointSize, 'n-resize', 'X'],
      l: [left - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y'],
      r: [left + width - halfPointSize, top + height / 2 - halfPointSize, 'e-resize', 'Y']
    }
  }
  function createTargetPosition ({ left, top, width, height }, pointSize: number) {
    const halfPointSize = pointSize / 2
    return {
      lt: [0 - halfPointSize, 0 - halfPointSize, 'nw-resize'],
      lb: [0 - halfPointSize, height - halfPointSize, 'ne-resize'],
      rt: [width - halfPointSize, 0 - halfPointSize, 'ne-resize'],
      rb: [width - halfPointSize, height - halfPointSize, 'nw-resize'],
      t: [width / 2 - halfPointSize, 0 - halfPointSize, 'n-resize'],
      b: [width / 2 - halfPointSize, height - halfPointSize, 'n-resize'],
      l: [0 - halfPointSize, height / 2 - halfPointSize, 'e-resize'],
      r: [width - halfPointSize, height / 2 - halfPointSize, 'e-resize']
    }
  }
}
