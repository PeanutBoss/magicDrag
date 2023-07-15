import { getElement, isNullOrUndefined, mergeObject } from "../utils/tools.ts";
import { onMounted, reactive, watch, onUnmounted } from 'vue'
import useMovePoint from "./useMovePoint.ts";
import { baseErrorTips } from './errorHandle.ts'

const All_DIRECTION = ['lt', 'lb', 'rt', 'rb', 'l', 'r', 't', 'b']

function getDirectionExplain (direction) {
  const hasL = direction.indexOf('l') > -1
  const hasR = direction.indexOf('r') > -1
  const hasB = direction.indexOf('b') > -1
  const hasT = direction.indexOf('t') > -1
  return {
    hasL,
    hasR,
    hasT,
    hasB
  }
}

function createCoordinateStrategies () {
  const strategies = {}
  All_DIRECTION.forEach(direction => {
    const { hasT, hasR, hasB, hasL } = getDirectionExplain(direction)
    strategies[direction] = ({ left, top, height, width, offsetX, offsetY }) => {
      return {
        left: conditionExecute(hasL, left + offsetX + 'px', left + 'px'),
        top: conditionExecute(hasT, top + offsetY + 'px', top + 'px'),
        width: conditionExecute(hasL, width - offsetX + 'px', conditionExecute(hasR, width + offsetX + 'px', width + 'px')),
        height: conditionExecute(hasT, height - offsetY + 'px', conditionExecute(hasB, height + offsetY + 'px', height + 'px'))
      }
    }
  })
  return strategies
}
// 移动不同轮廓点的策略 可以优化为获取样式信息的策略
const pointStrategies: any = createCoordinateStrategies()

function conditionExecute (condition, task1, task2) {
  return condition ? task1 : task2
}

// get the latest contour point coordinate policy after creating update target dimensions/coordinates
function createParamStrategies () {
  const strategies = {}
  All_DIRECTION.forEach(direction => {
    const { hasT, hasR, hasB, hasL } = getDirectionExplain(direction)
    strategies[direction] = ({ left, top, width, height, movementX, movementY }) => {
      return {
        left: conditionExecute(hasL, left + movementX.value, left),
        top: conditionExecute(hasT, top + movementY.value, top),
        width: conditionExecute(hasL, width - movementX.value, conditionExecute(hasR, width + movementX.value, width)),
        height: conditionExecute(hasT, height - movementY.value, conditionExecute(hasB, height + movementY.value, height))
      }
    }
  })
  return strategies
}
const paramStrategies = createParamStrategies()

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

function setStyle (target: HTMLElement, styleKey: string | object, styleValue?: string) {
  if (typeof styleKey === 'object') {
    const keys = Object.keys(styleKey)
    keys.forEach(key => {
      target.style[key] = styleKey[key]
    })
    return
  }
  target.style[styleKey] = styleValue
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

const defaultStyle = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #999',
  borderRadius: '50%',
  display: 'none',
  zIndex: '999'
}
// initializes the style of the contour points
function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }) {
  setStyle(point, defaultStyle)
  setStyle(point, 'width', pointSize + 'px')
  setStyle(point, 'height', pointSize + 'px')
  setStyle(point, 'cursor', pointPosition[direction][2])
  setPosition(point, pointPosition, direction)
}

// set element position
function setPosition (point: HTMLElement, pointPosition, direction) {
  setStyle(point, 'left', pointPosition[direction][0] + 'px')
  setStyle(point, 'top', pointPosition[direction][1] + 'px')
}

// creates/updates objects that record coordinate and dimension information for target elements
function updateInitialTarget (targetCoordinate?, newCoordinate?) {
  if (targetCoordinate && newCoordinate) {
    for (const key in targetCoordinate) {
      targetCoordinate[key] = newCoordinate[key]
    }
  }
  return reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })
}

// get coordinates and size information based on dom elements
function getCoordinateByElement (element: HTMLElement) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop
  }
}

export default function useDragResize (targetSelector: string | HTMLElement, options: any = {}) {
  // check whether targetSelector is a selector or an HTMLElement
  const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
  baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

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

  // the target element being manipulated
  let $target
  // coordinates and dimensions of the target element
  const initialTarget = updateInitialTarget()
  // save contour point
  const pointElements = {}

	onMounted(() => {
		initTarget()

    createDragPoint($target, pointSize)
	})
  onUnmounted(() => {
    // the dom element is destroyed when the page is uninstalled
    for (const direction in pointElements) {
      pointElements[direction].remove()
    }
  })

	function initTarget () {
		$target = getElement(targetSelector)
    baseErrorTips(!$target, 'targetSelector is an invalid selector or HTMLElement')

    // Ensure element absolute positioning
    setStyle($target, 'position', 'absolute')
    drag && setStyle($target, 'cursor', 'all-scroll')

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

  // a policy to limit the minimum size when resizing a target
  const resizeLimitStrategies: any = {
    lt ({ movementX, movementY }) {
      const { width, height } = initialTarget
      // the maximum distance that can be moved
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
      const moveMaxDistanceX = width - minWidth
      if (movementX.value > moveMaxDistanceX) {
        movementX.value = moveMaxDistanceX
      }
    },
    r ({ movementX }) {
      const { width, height } = initialTarget
      const moveMaxDistanceX = width - minWidth
      if (-movementX.value > moveMaxDistanceX) {
        movementX.value = -moveMaxDistanceX
      }
    },
    t ({ movementY }) {
      const { width, height } = initialTarget
      const moveMaxDistanceY = height - minHeight

      if (movementY.value > moveMaxDistanceY) {
        movementY.value = moveMaxDistanceY
      }
    },
    b ({ movementY }) {
      const { width, height } = initialTarget
      const moveMaxDistanceY = height - minHeight

      if (-movementY.value > moveMaxDistanceY) {
        movementY.value = -moveMaxDistanceY
      }
    }
  }

  // create outline points for dragging
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

        // update the width and height information when releasing the mouse
        watch(isPress, () => {
          if (!isPress.value) {
            updateInitialTarget(initialTarget, getCoordinateByElement(target))
          }
        })
      }
    }
  }

  function movePointCallback ({ target, direction, movementX, movementY, pointSize }) {
    // limits the minimum size of the target element
    resizeLimitStrategies[direction]({ movementX, movementY })

    // updates the coordinates and dimensions of the target element
    const styleData = pointStrategies[direction]({
      left: initialTarget.left,
      top: initialTarget.top,
      width: initialTarget.width,
      height: initialTarget.height,
      offsetX: movementX.value,
      offsetY: movementY.value
    })
    setStyle(target, styleData)

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

    window.addEventListener('mousedown', checkIsContainsTarget.bind(null, target))

    if (!drag) return
    // used to record the position information of each contour point when the target is pressed
    const downPointPosition = {}
    const { isPress, movementY, movementX } = useMovePoint(target, (moveAction) => {
      moveAction()
      for (const key in pointElements) {
        setStyle(pointElements[key], 'left', downPointPosition[key][0] + movementX.value + 'px')
        setStyle(pointElements[key], 'top', downPointPosition[key][1] + movementY.value + 'px')
      }
    })
    watch(isPress, () => {
      if (isPress.value) {
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        initialTarget.top += movementY.value
        initialTarget.left += movementX.value
      }
    })
  }

  function checkIsContainsTarget (target, event) {
    const blurElements = [target, ...Object.values(pointElements)]
    if (!blurElements.includes(event.target)) {
      // losing focus hides outline points
      for (const key in pointElements) {
        setStyle(pointElements[key], 'display', 'none')
      }
    } else {
      // outline points are displayed when in focus
      for (const key in pointElements) {
        setStyle(pointElements[key], 'display', 'block')
      }
    }
  }
}
