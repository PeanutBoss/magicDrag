import {conditionExecute, EXECUTE_NEXT_TASK, setStyle, transferControl, getObjectIntValue} from "./tools.ts";
import {reactive, watch} from 'vue';

export type Direction = 'lt' | 'lb' | 'rt' | 'rb' | 'l' | 'r' | 't' | 'b'
interface DirectionDescription {
	hasL: boolean
	hasR: boolean
	hasT: boolean
	hasB: boolean
}

// each element represents the direction of a contour point
// 每个元素代表一个轮廓点的方向
export const All_DIRECTION: Direction[] = ['lt', 'lb', 'rt', 'rb', 'l', 'r', 't', 'b']

// obtains this point according to the direction of the contour point
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

// create a strategy to move each contour point to update the coordinates and dimensions of the target element
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

// create a policy to limit the minimum size when resizing the target
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

// get the latest contour point coordinate policy after creating updated target dimensions/coordinates
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
// 设置元素坐标信息
export function setPosition (point: HTMLElement, pointPosition: PointPosition, direction: Direction) {
	setStyle(point, 'left', pointPosition[direction][0] + 'px')
	setStyle(point, 'top', pointPosition[direction][1] + 'px')
}

export function createParentPosition ({ left, top, width, height }, pointSize: number): PointPosition {
	console.log({ left, top, width, height }, 'initialTarget')
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
// 初始化轮廓点的样式
export function initPointStyle (point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption, pointDefaultStyle) {
  setStyle(point, pointDefaultStyle)
  setStyle(point, 'width', pointSize + 'px')
  setStyle(point, 'height', pointSize + 'px')
  setStyle(point, 'cursor', pointPosition[direction][2])
  setPosition(point, pointPosition, direction)
}

// update state - 更新状态
export function updateState (state, newState) {
	for (const targetKey in state) {
		state[targetKey] = newState[targetKey] ?? state[targetKey]
	}
}



/* moveTarget */
// controls how elements are displayed and hidden
// 控制元素的显示和隐藏
function showOrHideContourPoint (pointElements, isShow) {
  for (const key in pointElements) {
    setStyle(pointElements[key], 'display', isShow ? 'block' : 'none')
  }
}
function checkIsContains (target, pointElements, event) {
  const blurElements = [target, ...Object.values(pointElements)]
  if (!blurElements.includes(event.target)) {
    // losing focus hides outline points
    // 失焦时隐藏轮廓点
    showOrHideContourPoint(pointElements, false)
  } else {
    // outline points are displayed when in focus
    // 聚焦时将显示轮廓点
    showOrHideContourPoint(pointElements, true)
  }
}
// control the focus and out-of-focus display of the target element's outline points
// 控制目标元素轮廓点的焦点和失焦显示
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
// 更新轮廓点位置
export function updateContourPointPosition (downPointPosition, movement, pointElements) {
  for (const key in pointElements) {
    setStyle(pointElements[key], 'left', downPointPosition[key][0] + movement.x + 'px')
    setStyle(pointElements[key], 'top', downPointPosition[key][1] + movement.y + 'px')
  }
}
export function moveTargetCallback (dragCallback, { downPointPosition, pointElements, targetState, initialTarget }) {
  return (moveAction, movement) => {
    // Wrap the action to move the target element as a separate new function, and if the user defines a callback
    // use moveTargetAction as an argument to that callback
    // 将移动目标元素的操作包装为单独新的函数,如果用户有定义回调，则将moveTargetAction作为这个回调的参数
    const moveTargetAction = () => {
      // perform the default action for movePoint
      // 执行movePoint的默认动作
      moveAction()
      // update the position of the contour points
      // 更新轮廓点位置
      updateContourPointPosition(downPointPosition, movement, pointElements)
    }
    // Hand over control (moveTargetAction)
    // 将控制权（moveTargetAction）交出
    transferControl(moveTargetAction, dragCallback, { movementX: movement.x, movementY: movement.y })
		// update the state of the target element - 更新目标元素状态
		updateState(targetState, { left: initialTarget.left + movement.x, top: initialTarget.top + movement.y })
  }
}



/* movePoint */
// updates the coordinates and dimensions of the target element
// 更新目标元素的坐标和尺寸
export function updateTargetStyle (target, { direction, movementX, movementY }, { targetState, initialTarget }) {
  const pointStrategies = createCoordinateStrategies()
  // the browser calculates and updates the element style information with each frame update to avoid unnecessary calculations
  // 浏览器在每次帧更新时计算并更新元素样式信息，以避免不必要的计算
  const styleData = pointStrategies[direction]({
    left: initialTarget.left,
    top: initialTarget.top,
    width: initialTarget.width,
    height: initialTarget.height,
    offsetX: movementX.value,
    offsetY: movementY.value
  })

	whetherUpdateState(direction, targetState, styleData)

  setStyle(target, styleData)
  return EXECUTE_NEXT_TASK
}

// updates are required only if hasL or hasT is satisfied
// 只有满足 hasL 或 hasT 的情况下才需要更新
function whetherUpdateState (direction, targetState, newState) {
	const { hasL, hasT } = getDirectionDescription(direction)
	const { left, top, width, height } = getObjectIntValue(newState)
	if (hasT && hasL) {
		updateState(targetState, { left, top, width, height })
	} else if (hasT) {
		updateState(targetState, { top, width, height })
	} else if (hasL) {
		updateState(targetState, { left, width, height })
	} else {
		updateState(targetState, { width, height })
	}
}

// update the coordinate information of contour points
// 更新轮廓点坐标信息
export function updatePointPosition (target, { direction, movementX, movementY }, { initialTarget, pointElements, pointSize, pointState }) {
  const paramStrategies = createParamStrategies()
  // obtain the latest coordinate and dimension information of target. Different strategies are used
  // to calculate coordinates and dimensions at different points
  // 获取目标的最新坐标和尺寸信息。使用不同的策略计算不同点的坐标和尺寸
  const coordinate = paramStrategies[direction]({ ...initialTarget, movementX, movementY })
  // set the position of the contour points based on the new coordinates and dimension information
  // 根据新的坐标和尺寸信息设置轮廓点的位置
  const pointPosition = createParentPosition(coordinate, pointSize)
  for (const innerDirection in pointPosition) {
    // there is no need to update the current drag point
    // 不需要更新当前拖拽的点
    if (innerDirection === direction) {
      const newState = {
        direction,
        left: pointPosition[innerDirection][0],
        top: pointPosition[innerDirection][1],
        movementX: movementX.value,
        movementY: movementY.value
      }
      updateState(pointState, newState)
      continue
    }
    // set the innerDirection position of the contour point
    // 设置轮廓点的innerDirection位置
    setPosition(pointElements[innerDirection], pointPosition, innerDirection as Direction)
  }
}
// limits the minimum size of the target element
// 限制目标元素的最小尺寸
export function limitTargetResize (target, { direction, movementX, movementY }, { initialTarget, minWidth, minHeight }) {
  // a policy to limit the minimum size when resizing a target
  // 调整目标大小时限制最小尺寸的策略
  const resizeLimitStrategies = createResizeLimitStrategies(initialTarget, minWidth, minHeight)
  resizeLimitStrategies[direction]({ movementX, movementY })

  // TODO 限制最大尺寸
  return EXECUTE_NEXT_TASK
}



/* ready to drag and resize - 准备拖动和调整大小 */
// get coordinates and size information based on dom elements
// 获取基于dom元素的坐标和大小信息
function getCoordinateByElement (element: HTMLElement) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop
  }
}
export function pointIsPressChangeCallback (target, { initialTarget, pointState }) {
  return newV => {
    pointState.isPress = newV
    if (!newV) {
      updateInitialTarget(initialTarget, getCoordinateByElement(target))
    }
  }
}
// creates/updates objects that record coordinate and dimension information for target elements
// 创建/更新记录目标元素坐标和维度信息的对象
export function updateInitialTarget (targetCoordinate?, newCoordinate?) {
  if (targetCoordinate && newCoordinate) {
		updateState(targetCoordinate, newCoordinate)
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
  // 确保元素绝对定位
  setStyle(target, 'position', 'absolute')
  // modify the icon for the hover state
  // 修改悬停状态的图标
  drag && setStyle(target, 'cursor', 'all-scroll')
}
