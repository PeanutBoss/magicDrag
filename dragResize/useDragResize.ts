import { getElement, isNullOrUndefined, mergeObject } from "../utils/tools.ts";
import { onMounted, reactive, watch, onUnmounted } from 'vue'
import useMovePoint from "./useMovePoint.ts";
import { baseErrorTips } from './errorHandle.ts'

/*
* TODO 注释
*  1.初始化目标元素
*  2.初始化/移动轮廓点
*  3.移动目标元素
* */

// 移动不同轮廓点的策略
const pointStrategies: any = {
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
const paramStrategies: any = {
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

const defaultOptions = {
  minWidth: 100,
  minHeight: 100,
  pointSize: 10,
  skill: {
    resize: true,
    drag: true,
    limitRatio: [3, 4]
  },
  pageHasScrollBar: false
}

export default function useDragResize (targetSelector: string | HTMLElement, options: any = {}) {
  // check whether targetSelector is a selector or an HTMLElement
  baseErrorTips(
    typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement),
    'targetSelector should be a selector or HTML Element'
  )

  // check that the type of options passed in is correct
  for (const key in defaultOptions) {
    const value = options[key]
    if (isNullOrUndefined(value)) continue
    const originType = typeof defaultOptions[key]
    const paramsType = typeof value
    baseErrorTips(
      originType !== paramsType,
      `The type of options.${key} should be ${originType}, But the ${paramsType} type is passed in.`
      )
  }

  options = mergeObject(defaultOptions, options)
  console.log(options)
  const { minWidth, minHeight, pointSize, pageHasScrollBar, skill } = options
  const { resize, drag, limitRatio } = skill

  let $target
  const initialTarget = reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })

	onMounted(() => {
		initTarget()

    createDragPoint($target, pointSize)
	})
  onUnmounted(() => {
    // 页面卸载时销毁dom元素
    for (const direction in pointElements) {
      pointElements[direction].remove()
    }
  })

	function initTarget () {
		$target = getElement(targetSelector)
    baseErrorTips(!$target, 'targetSelector is an invalid selector or HTMLElement')

    // Ensure element absolute positioning
    $target.style.position = 'absolute'
    const { left, top, height, width } = $target.getBoundingClientRect()
    const rect = {
      left: pageHasScrollBar ? left + window.scrollX : left,
      top: pageHasScrollBar ? top + window.scrollY : top,
      height,
      width
    }
    for (const rectKey in initialTarget) {
      initialTarget[rectKey] = rect[rectKey]
    }
	}

  const pointElements = {}

  // 调整target尺寸时限制最小尺寸的策略
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

  // 初始化轮廓点的样式
  function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }) {
    point.style.position = 'absolute'
    point.style.width = pointSize + 'px'
    point.style.height = pointSize + 'px'
    point.style.boxSizing = 'border-box'
    point.style.border = '1px solid #999'
    point.style.borderRadius = '50%'
    point.style.display = 'none'
    point.style.zIndex = '9'
    setPosition(point, pointPosition, direction)
    point.style.cursor = pointPosition[direction][2]
  }

  // 创建供拖拽的元素
  function createDragPoint (target: HTMLElement, pointSize: number) {
    const parentNode = target.parentNode

    moveTarget(target)

    if (resize) {
      const pointPosition = createParentPosition(initialTarget, pointSize)
      for (const direction in pointPosition) {
        const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
        initPointStyle(point, { pointPosition, direction, pointSize })
        parentNode.appendChild(point)

        const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
          moveAction()
          movePointCallback({ target, direction, movementX, movementY, pointSize })
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
  }

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

  function moveTarget (target: HTMLElement) {
    if (!drag) {
      window.onmousedown = checkIsContainsTarget.bind(null, target)
      target.onmousedown = mousedown
      return
    }
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
        window.onmousedown = checkIsContainsTarget.bind(null, target)
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    })
  }

  function mousedown () {
    console.log('down')
    // 点击目标元素显示轮廓点
    for (const key in pointElements) {
      pointElements[key].style.display = 'block'
    }
  }
  function checkIsContainsTarget (target, event) {
    const blurElements = [target, ...Object.values(pointElements)]
    if (!blurElements.includes(event.target)) {
      // 失去交点隐藏轮廓点
      for (const key in pointElements) {
        pointElements[key].style.display = 'none'
      }
    }
  }

  // 设置元素位置
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
}
