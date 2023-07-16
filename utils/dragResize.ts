import {conditionExecute, EXECUTE_NEXT_TASK, setStyle} from "./tools.ts";
import {reactive, watch} from 'vue';

export type Direction = 'lt' | 'lb' | 'rt' | 'rb' | 'l' | 'r' | 't' | 'b'
interface DirectionDescription {
	hasL: boolean
	hasR: boolean
	hasT: boolean
	hasB: boolean
}

// 每个元素代表一个轮廓点的方向
export const All_DIRECTION: Direction[] = ['lt', 'lb', 'rt', 'rb', 'l', 'r', 't', 'b']

// 根据轮廓点的方向获取这个点的
export function getDirectionDescription (direction: Direction):DirectionDescription {
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

// 创建移动各个轮廓点更新目标元素坐标与尺寸信息的策略
export function createCoordinateStrategies () {
	const strategies = {}
	All_DIRECTION.forEach(direction => {
		const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
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

// 创建调整目标大小时限制最小尺寸的策略
export function createResizeLimitStrategies (initialTarget, minWidth, minHeight) {
	const strategies = {}
	const leftTask = (movementX, moveMaxDistanceX) => {
		if (movementX.value > moveMaxDistanceX) {
			movementX.value = moveMaxDistanceX
		}
	}
	const topTask = (movementY, moveMaxDistanceY) => {
		if (movementY.value > moveMaxDistanceY) {
			movementY.value = moveMaxDistanceY
		}
	}
	const bottomTask = (movementY, moveMaxDistanceY) => {
		if (-movementY.value > moveMaxDistanceY) {
			movementY.value = -moveMaxDistanceY
		}
	}
	const rightTask = (movementX, moveMaxDistanceX) => {
		if (-movementX.value > moveMaxDistanceX) {
			movementX.value = -moveMaxDistanceX
		}
	}

	All_DIRECTION.forEach(direction => {
		strategies[direction] = ({ movementX, movementY }) => {
			const { width, height } = initialTarget
			const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
			// the maximum distance that can be moved
			const moveMaxDistanceX = width - minWidth
			const moveMaxDistanceY = height - minHeight

			hasL && leftTask(movementX, moveMaxDistanceX)
			hasT && topTask(movementY, moveMaxDistanceY)
			hasR && rightTask(movementX, moveMaxDistanceX)
			hasB && bottomTask(movementY, moveMaxDistanceY)
		}
	})
	return strategies
}

// 创建更新目标尺寸/坐标后获取最新的轮廓点坐标策略
export function createParamStrategies () {
	const strategies = {}
	All_DIRECTION.forEach(direction => {
		const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
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

export type PointPosition = {
	[key in Direction]: [number, number, string?, ('X' | 'Y')?]
}
// set element position
export function setPosition (point: HTMLElement, pointPosition: PointPosition, direction: Direction) {
	setStyle(point, 'left', pointPosition[direction][0] + 'px')
	setStyle(point, 'top', pointPosition[direction][1] + 'px')
}

export function createParentPosition ({ left, top, width, height }, pointSize: number): PointPosition {
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

interface InitPointOption {
  pointPosition: PointPosition
  direction: Direction
  pointSize: number
}
// initializes the style of the contour points
export function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption, pointDefaultStyle) {
  setStyle(point, pointDefaultStyle)
  setStyle(point, 'width', pointSize + 'px')
  setStyle(point, 'height', pointSize + 'px')
  setStyle(point, 'cursor', pointPosition[direction][2])
  setPosition(point, pointPosition, direction)
}



/* moveTarget */
// controls how elements are displayed and hidden
function showOrHideContourPoint (pointElements, isShow) {
  for (const key in pointElements) {
    setStyle(pointElements[key], 'display', isShow ? 'block' : 'none')
  }
}
function checkIsContains (target, pointElements, event) {
  const blurElements = [target, ...Object.values(pointElements)]
  if (!blurElements.includes(event.target)) {
    // losing focus hides outline points
    showOrHideContourPoint(pointElements, false)
  } else {
    // outline points are displayed when in focus
    showOrHideContourPoint(pointElements, true)
  }
}
// control the focus and out-of-focus display of the target element's outline points
export function blurOrFocus (pointElements) {
  let checkIsContainsTarget
  return (target: HTMLElement, isBind = true) => {
    if (isBind) {
      window.addEventListener('mousedown', checkIsContainsTarget ?? (checkIsContainsTarget = checkIsContains.bind(null, target, pointElements)))
    } else {
      window.removeEventListener('mousedown', checkIsContainsTarget)
    }
  }
}

// update the position of the contour points
export function updateContourPointPosition (downPointPosition, movement, pointElements) {
  for (const key in pointElements) {
    setStyle(pointElements[key], 'left', downPointPosition[key][0] + movement.x + 'px')
    setStyle(pointElements[key], 'top', downPointPosition[key][1] + movement.y + 'px')
  }
}
export function moveTargetCallback (downPointPosition, dragCallback, pointElements) {
  return (moveAction, movement) => {
    // perform the default action for movePoint
    moveAction()
    // update the position of the contour points
    updateContourPointPosition(downPointPosition, movement, pointElements)
    // perform user-defined operations
    dragCallback?.({ movementX: movement.x, movementY: movement.y })
  }
}



/* movePoint */
// updates the coordinates and dimensions of the target element
export function updateTargetStyle (target, { direction, movementX, movementY }, { initialTarget }) {
  const pointStrategies = createCoordinateStrategies()
  // the browser calculates and updates the element style information with each frame update to avoid unnecessary calculations
  const styleData = pointStrategies[direction]({
    left: initialTarget.left,
    top: initialTarget.top,
    width: initialTarget.width,
    height: initialTarget.height,
    offsetX: movementX.value,
    offsetY: movementY.value
  })
  setStyle(target, styleData)
  return EXECUTE_NEXT_TASK
}
// update the coordinate information of contour points
export function updatePointPosition (target, { direction, movementX, movementY, pointSize }, { initialTarget, pointElements }) {
  const paramStrategies = createParamStrategies()
  // make sure that updates to the mobile process are synchronized with the browser's refresh rate
  // obtain the latest coordinate and dimension information of target. Different strategies are used
  // to calculate coordinates and dimensions at different points
  const coordinate = paramStrategies[direction]({ ...initialTarget, movementX, movementY })
  // set the position of the contour points based on the new coordinates and dimension information
  const pointPosition = createParentPosition(coordinate, pointSize)
  for (const innerDirection in pointPosition) {
    // 不需要更新当前拖拽的点
    if (innerDirection === direction) continue
    // set the innerDirection position of the contour point
    setPosition(pointElements[innerDirection], pointPosition, innerDirection as Direction)
  }
}
// limits the minimum size of the target element
export function limitTargetResize (target, { direction, movementX, movementY }, { initialTarget, minWidth, minHeight }) {
  // a policy to limit the minimum size when resizing a target
  const resizeLimitStrategies = createResizeLimitStrategies(initialTarget, minWidth, minHeight)
  resizeLimitStrategies[direction]({ movementX, movementY })
  return EXECUTE_NEXT_TASK
}



/* ready to drag and resize */
// get coordinates and size information based on dom elements
function getCoordinateByElement (element: HTMLElement) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop
  }
}
export function pointIsPressChangeCallback (target, initialTarget) {
  return newV => {
    if (!newV) {
      updateInitialTarget(initialTarget, getCoordinateByElement(target))
    }
  }
}
// creates/updates objects that record coordinate and dimension information for target elements
export function updateInitialTarget (targetCoordinate?, newCoordinate?) {
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
export function initTargetStyle (target, drag) {
  // ensure element absolute positioning
  setStyle(target, 'position', 'absolute')
  // modify the icon for the hover state
  drag && setStyle(target, 'cursor', 'all-scroll')
}
