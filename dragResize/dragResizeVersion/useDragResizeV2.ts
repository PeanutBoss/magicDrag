import { getElement } from "../utils/tools.ts";
import { onMounted, reactive, watch, onBeforeUnmount } from 'vue'
import useMovePoint from "./useMovePoint.ts";
import { markLog } from "./toosl.ts";

/*
* TODO 注释
*  1.初始化目标元素
*  2.初始化/移动轮廓点
*  3.移动目标元素
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

let targetIndex = 0, selectedIndex
const targetMap = {}

export default function useDragResizeV2 (targetSelector: string | HTMLElement, resizeOptions = {}) {
  const { minWidth = 100, minHeight = 100 } = resizeOptions
  onMounted(() => {
    initTarget()

    createDragPoint($target, 10)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', bindCheckIsContainsTarget)

    $target.removeEventListener('mousedown', mousedown)
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
    // 保证元素绝对定位
    $target.style.position = 'absolute'
    targetMap[targetIndex] = $target
    $target.setAttribute('data-index', targetIndex++)
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

  // 初始化轮廓点的样式
  function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }) {
    point.style.position = 'absolute'
    point.style.width = pointSize + 'px'
    point.style.height = pointSize + 'px'
    point.style.boxSizing = 'border-box'
    point.style.border = '1px solid #333'
    point.style.borderRadius = '50%'
    point.style.display = 'none'
    setPosition(point, pointPosition, direction)
    point.style.cursor = pointPosition[direction][2]
  }

  // 创建供拖拽的元素
  function createDragPoint (target: HTMLElement, pointSize: number) {
    const parentNode = target.parentNode
    const pointPosition = createParentPosition(initialTarget, pointSize)

    moveTarget(target)
    bindEvent(target)

    for (const direction in pointPosition) {
      const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
      initPointStyle(point, { pointPosition, direction, pointSize })
      parentNode.appendChild(point)

      const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
        moveAction()
        movePointCallback({ target: targetMap[selectedIndex], direction, movementX, movementY, pointSize })
      }, { direction: pointPosition[direction][3] })

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

  // TODO 优化
  const resizeLimitStrategies = {
    lt ({ movementX, movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      const moveMaxDistanceY = height - minHeight
      if (movementX.value > moveMaxDistanceX) {
        movementX.value = moveMaxDistanceX
      }

      if (movementY.value > moveMaxDistanceY) {
        movementY.value = moveMaxDistanceY
      }
    },
    lb ({ movementX, movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      const moveMaxDistanceY = height - minHeight
      if (movementX.value > moveMaxDistanceX) {
        movementX.value = moveMaxDistanceX
      }
      if (-movementY.value > moveMaxDistanceY) {
        movementY.value = -moveMaxDistanceY
      }
    },
    rt ({ movementX, movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      const moveMaxDistanceY = height - minHeight
      if (-movementX.value > moveMaxDistanceX) {
        movementX.value = -moveMaxDistanceX
      }

      if (movementY.value > moveMaxDistanceY) {
        movementY.value = moveMaxDistanceY
      }
    },
    rb ({ movementX, movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      const moveMaxDistanceY = height - minHeight
      if (-movementX.value > moveMaxDistanceX) {
        movementX.value = -moveMaxDistanceX
      }

      if (-movementY.value > moveMaxDistanceY) {
        movementY.value = -moveMaxDistanceY
      }
    },
    l ({ movementX }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      if (movementX.value > moveMaxDistanceX) {
        movementX.value = moveMaxDistanceX
      }
    },
    r ({ movementX }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceX = width - minWidth
      if (-movementX.value > moveMaxDistanceX) {
        movementX.value = -moveMaxDistanceX
      }
    },
    t ({ movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceY = height - minHeight

      if (movementY.value > moveMaxDistanceY) {
        movementY.value = moveMaxDistanceY
      }
    },
    b ({ movementY }) {
      const { width, height } = initialTarget
      // 可以移动的最大距离
      const moveMaxDistanceY = height - minHeight

      if (-movementY.value > moveMaxDistanceY) {
        movementY.value = -moveMaxDistanceY
      }
    }
  }

  // 根据按下点的移动信息 调整元素尺寸和定位
  function movePointCallback ({ target, direction, movementX, movementY, pointSize }) {

    // 限制目标元素最小尺寸
    resizeLimitStrategies[direction]({ movementX, movementY })

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


  const downPointPosition = {}
  function moveTarget (target: HTMLElement) {
    // 使元素可以进行焦点设置，但不会参与默认的焦点顺序
    target.tabIndex = -1
    const { isPress, movementY, movementX } = useMovePoint(target, (moveAction) => {
      moveAction()
      // 更新轮廓点的位置信息
      markLog('更新轮廓点位置')
      for (const key in pointElements) {
        pointElements[key].style.left = downPointPosition[key][0] + movementX.value + 'px'
        pointElements[key].style.top = downPointPosition[key][1] + movementY.value + 'px'
      }
    })
    watch(isPress, () => {
      if (isPress.value) {
        // do sth...
      } else {
        // 更新 target 的位置信息
        markLog('更新target位置')
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    }, { immediate: true })
  }

  function mousedown (event) {
    markLog('记录轮廓点位置')
    selectedIndex = event.target.dataset.index

    const coordinate = {
      left: event.pageX - event.offsetX,
      top: event.pageY - event.offsetY,
      height: event.target.offsetHeight,
      width: event.target.offsetWidth
    }

    const pointSize = 10
    // 计算按下元素轮廓点的位置
    const pointPosition = createParentPosition(coordinate, pointSize)
    // 按下时更新轮廓点坐标信息
    for (const key in pointElements) {
      downPointPosition[key] = pointPosition[key]
    }
    // 显示元素并更新轮廓点位置
    requestAnimationFrame(() => {
      for (const innerDirection in pointPosition) {
        pointElements[innerDirection].style.display = 'block'
        // 设置 innerDirection 对应点的位置信息
        setPosition(pointElements[innerDirection], pointPosition, innerDirection)
      }
    })
  }

  // 设置轮廓点坐标
  function setPosition (point: HTMLElement, pointPosition, direction) {
    point.style.left = pointPosition[direction][0] + 'px'
    point.style.top = pointPosition[direction][1] + 'px'
  }

  // 根据目标元素坐标和尺寸信息获取轮廓点坐标信息
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



  // 模拟聚焦失焦（控制轮廓点显示隐藏）
  let bindCheckIsContainsTarget
  function bindEvent (target: HTMLElement) {
    bindCheckIsContainsTarget = checkIsContainsTarget.bind(null, target)
    target.addEventListener('mousedown', mousedown)
    // 检查是否失焦——隐藏轮廓点
    window.addEventListener('mousedown', bindCheckIsContainsTarget)
  }
  // 检查按下的元素是否在聚焦元素的列表中
  function checkIsContainsTarget (target, event) {
    const blurElements = [target, ...Object.values(pointElements)]
    if (!blurElements.includes(event.target)) {
      // 失去交点隐藏轮廓点
      for (const key in pointElements) {
        pointElements[key].style.display = 'none'
      }
    }
  }
}
