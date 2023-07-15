import { getElement, isNullOrUndefined, mergeObject, removeElements, baseErrorTips } from "../utils/tools.ts";
import {onMounted, reactive, watch, onUnmounted, ref, Ref} from 'vue'
import useMovePoint from "./useMovePoint.ts";
import { createCoordinateStrategies, createParamStrategies, createResizeLimitStrategies, setPosition, createParentPosition } from '../utils/dragResize.ts'
import type { Direction, PointPosition } from '../utils/dragResize.ts'

// 移动不同轮廓点的策略 可以优化为获取样式信息的策略
const pointStrategies = createCoordinateStrategies()

const paramStrategies = createParamStrategies()

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

interface InitPointOption {
  pointPosition: PointPosition
  direction: Direction
  pointSize: number
}
// initializes the style of the contour points
function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption) {
  setStyle(point, pointDefaultStyle)
  setStyle(point, 'width', pointSize + 'px')
  setStyle(point, 'height', pointSize + 'px')
  setStyle(point, 'cursor', pointPosition[direction][2])
  setPosition(point, pointPosition, direction)
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

interface DragResizeOptions {
  minWidth?: number
  minHeight?: number
  pointSize?: number
  pageHasScrollBar?: boolean
  skill?: {
    resize?: boolean
    drag?: boolean
    limitRatio?: [number, number]
  },
  callbacks?: {
    dragCallback?: (movement: { movementX: number, movementY: number }) => void
    resizeCallback?: (direction: Direction, movement: { movementX: number, movementY: number } ) => void
  }
}
// default configuration
const defaultOptions: DragResizeOptions = {
  minWidth: 100, // minimum width
  minHeight: 100, // minimum height
  pointSize: 10, // the size of the contour point
  pageHasScrollBar: false, // whether the page has a scroll bar
  skill: {
    resize: true, // whether the size adjustment is supported
    drag: true // whether to support dragging
  },
  callbacks: {}
}

// default style for contour points
const pointDefaultStyle: { [key: string]: string } = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #999',
  borderRadius: '50%',
  display: 'none',
  zIndex: '999'
}

/*
* {
    targetIsPress: targetMoveInfo.isPress,
    targetCanIMove: targetMoveInfo.canIMove,
    targetMovement: {
      movementX: targetMoveInfo.movementX,
      movementY: targetMoveInfo.movementY
    },
    targetCoordinate: {
      left: targetMoveInfo.left,
      top: targetMoveInfo.top,
      width: ref(targetMoveInfo.movementX + initialTarget.width),
      height: ref(targetMoveInfo.movementY + initialTarget.height)
    }
  }
* */
interface DragResizeState {
  targetIsPress: Ref<boolean>
  targetCanIMove: Ref<{ x: boolean, y: boolean }>
  targetMovement: { movementX: Ref<number>, movementY: Ref<number> }
  targetCoordinate: {
    left: Ref<number>
    top: Ref<number>
    width: Ref<number>
    height: Ref<number>
  }
}

export default function useDragResize (targetSelector: string | HTMLElement, options: DragResizeOptions) {
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
  const { minWidth, minHeight, pointSize, pageHasScrollBar, skill, callbacks } = options
  const { resize, drag, limitRatio } = skill
  const { dragCallback, resizeCallback } = callbacks

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
    removeElements(Object.values(pointElements))
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
  const resizeLimitStrategies = createResizeLimitStrategies(initialTarget, minWidth, minHeight)

  // create outline points for dragging
  function createDragPoint (target: HTMLElement, pointSize: number) {
    const parentNode = target.parentNode

    moveTarget(target)

    if (resize) {
      const pointPosition = createParentPosition(initialTarget, pointSize)
      for (const direction in pointPosition) {
        const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
        initPointStyle(point, { pointPosition, direction: direction as Direction, pointSize })
        parentNode.appendChild(point)

        const { isPress, movementX, movementY } = useMovePoint(point, (moveAction) => {
          moveAction()
          movePointCallback({ target, direction, movementX, movementY, pointSize })
          resizeCallback?.(direction as Direction, { movementX: movementX.value, movementY: movementY.value })
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
      setPosition(pointElements[innerDirection], pointPosition, innerDirection as Direction)
    }
  }

  let targetMoveInfo = reactive({})
  function moveTarget (target: HTMLElement) {

    window.addEventListener('mousedown', checkIsContainsTarget.bind(null, target))

    if (!drag) return
    // used to record the position information of each contour point when the target is pressed
    const downPointPosition = {}
    targetMoveInfo = useMovePoint(target, (moveAction) => {
      moveAction()
      for (const key in pointElements) {
        setStyle(pointElements[key], 'left', downPointPosition[key][0] + targetMoveInfo.movementX.value + 'px')
        setStyle(pointElements[key], 'top', downPointPosition[key][1] + targetMoveInfo.movementY.value + 'px')
      }
      dragCallback?.({ movementX: targetMoveInfo.movementX.value, movementY: targetMoveInfo.movementY.value })
    })
    watch(targetMoveInfo.isPress, (newV) => {
      if (newV) {
        for (const key in pointElements) {
          downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
        }
      } else {
        initialTarget.top += targetMoveInfo.movementY.value
        initialTarget.left += targetMoveInfo.movementX.value
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

  return {
    // targetIsPress: targetMoveInfo.isPress,
    // targetCanIMove: targetMoveInfo.canIMove,
    // targetMovement: {
    //   movementX: targetMoveInfo.movementX,
    //   movementY: targetMoveInfo.movementY
    // },
    // targetCoordinate: {
    //   left: targetMoveInfo.left,
    //   top: targetMoveInfo.top,
    //   width: ref(targetMoveInfo.movementX + initialTarget.width),
    //   height: ref(targetMoveInfo.movementY + initialTarget.height)
    // }
  }
}
