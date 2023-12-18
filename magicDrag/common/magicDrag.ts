/* strong correlation functional - 强相关的功能 */

import { conditionExecute, generateID, getObjectIntValue, memoize, numberToStringSize, setStyle } from '../utils/tools'
import { getTargetZIndex, TargetStatus } from '../style/className'
import { MagicDragOptions } from './globalData'

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
export function createCoordinateStrategies() {
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
export const memoizeCreateCoordinateStrategies = memoize(createCoordinateStrategies)

/*
* movementX/Y: 鼠标移动的距离
* limitMinDistanceX/Y: 限制最小尺寸时可移动的最大距离
* limitMaxDistanceX/Y: 限制最大尺寸时可移动的最大距离
* */
// 限制目标元素尺寸
const limitSizeTasks = {
	left ({ movementX, limitMinDistanceX, limitMaxDistanceX }) {
		// 限制最小尺寸
		movementX.value > limitMinDistanceX && (movementX.value = limitMinDistanceX)
		// 限制最大尺寸
		limitMaxDistanceX + movementX.value < 0 && (movementX.value = -limitMaxDistanceX)
	},
	right ({ movementX, limitMinDistanceX, limitMaxDistanceX }) {
		-movementX.value > limitMinDistanceX && (movementX.value = -limitMinDistanceX)

		movementX.value > limitMaxDistanceX && (movementX.value = limitMaxDistanceX)
	},
	top ({ movementY, limitMinDistanceY, limitMaxDistanceY }) {
		movementY.value > limitMinDistanceY && (movementY.value = limitMinDistanceY)

		limitMaxDistanceY + movementY.value < 0 && (movementY.value = -limitMaxDistanceY)
	},
	bottom ({ movementY, limitMinDistanceY, limitMaxDistanceY }) {
		-movementY.value > limitMinDistanceY && (movementY.value = -limitMinDistanceY)

		movementY.value > limitMaxDistanceY && (movementY.value = limitMaxDistanceY)
	}
}
// 限制目标元素的移动边界
const limitBoundaryTasks = {
	left ({ movementX, coordinate, containerInfo }) {
		movementX.value + coordinate.left - containerInfo.paddingLeft <= 0 && (movementX.value = containerInfo.paddingLeft - coordinate.left)
	},
	right ({ movementX, coordinate, containerInfo }) {
		movementX.value + coordinate.left + coordinate.width >= containerInfo.width + containerInfo.paddingLeft &&
		(movementX.value = containerInfo.width - coordinate.left - coordinate.width + containerInfo.paddingLeft)
	},
	top ({ movementY, coordinate, containerInfo }) {
		movementY.value + coordinate.top - containerInfo.paddingTop <= 0 && (movementY.value = containerInfo.paddingTop - coordinate.top)
	},
	bottom ({ movementY, coordinate, containerInfo }) {
		movementY.value + coordinate.top + coordinate.height >= containerInfo.height + containerInfo.paddingTop &&
		(movementY.value = containerInfo.height - coordinate.top - coordinate.height + containerInfo.paddingTop)
	}
}
// create a policy to limit the minimum size when resizing the target
// 创建调整目标大小时限制最小尺寸的策略
export function createResizeLimitStrategies({ minWidth, minHeight, maxWidth, maxHeight }, { coordinate, containerInfo }) {
	const strategies = {}
	const leftTask = (movementX, limitMinDistanceX, limitMaxDistanceX) => {
		limitSizeTasks.left({ movementX, limitMinDistanceX, limitMaxDistanceX })
		limitBoundaryTasks.left({ movementX, coordinate, containerInfo })
	}
	const topTask = (movementY, limitMinDistanceY, limitMaxDistanceY) => {
		limitSizeTasks.top({ movementY, limitMinDistanceY, limitMaxDistanceY })
		limitBoundaryTasks.top({ movementY, coordinate, containerInfo })
	}
	const bottomTask = (movementY, limitMinDistanceY, limitMaxDistanceY) => {
		limitSizeTasks.bottom({ movementY, limitMinDistanceY, limitMaxDistanceY })
		limitBoundaryTasks.bottom({ movementY, coordinate, containerInfo })
	}
	const rightTask = (movementX, limitMinDistanceX, limitMaxDistanceX) => {
		limitSizeTasks.right({ movementX, limitMinDistanceX, limitMaxDistanceX })
		limitBoundaryTasks.right({ movementX, coordinate, containerInfo })
	}

	All_DIRECTION.forEach(direction => {
		strategies[direction] = ({ movementX, movementY }) => {
			const { width, height } = coordinate
			const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
			// the maximum distance that can be moved
			const limitMinDistanceX = width - minWidth
			const limitMinDistanceY = height - minHeight
			const limitMaxDistanceX = maxWidth - width
			const limitMaxDistanceY = maxHeight - height

			hasL && leftTask(movementX, limitMinDistanceX, limitMaxDistanceX)
			hasT && topTask(movementY, limitMinDistanceY, limitMaxDistanceY)
			hasR && rightTask(movementX, limitMinDistanceX, limitMaxDistanceX)
			hasB && bottomTask(movementY, limitMinDistanceY, limitMaxDistanceY)
		}
	})
	return strategies
}

// get the latest contour point coordinate policy after creating updated target dimensions/coordinates
// 创建更新目标尺寸/坐标后获取最新的轮廓点坐标策略
export function createPositionStrategies () {
	const strategies = {}
	All_DIRECTION.forEach(direction => {
		const { hasT, hasR, hasB, hasL } = getDirectionDescription(direction)
		strategies[direction] = ({ left, top, width, height, movementX, movementY }) => {
			return {
				left: conditionExecute(hasL, left + movementX, left),
				top: conditionExecute(hasT, top + movementY, top),
				width: conditionExecute(hasL, width - movementX, conditionExecute(hasR, width + movementX, width)),
				height: conditionExecute(hasT, height - movementY, conditionExecute(hasB, height + movementY, height))
			}
		}
	})
	return strategies
}
export const memoizeCreatePositionStrategies = memoize(createPositionStrategies)

export type PointPosition = {
	// 										left		top			cursor	limitDirection
	[key in Direction]?: [number, number, string?, ('X' | 'Y')?]
}
// set element position
// 设置元素坐标信息
export function setPosition(point: HTMLElement, pointPosition: PointPosition, direction: Direction) {
	setStyle(point, 'left', pointPosition[direction][0] + 'px')
	setStyle(point, 'top', pointPosition[direction][1] + 'px')
}

// 根据目标元素的尺寸、位置信息和轮廓点尺寸生成各个轮廓点的位置信息
export function createParentPosition ({ left, top, width, height }, pointSize: number) {
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

export interface InitPointOption {
  pointPosition: PointPosition
  direction: Direction
  pointSize: number
}

// update state - 更新状态
export function updateState (state, keyOrState: object | string, value?) {
	if (typeof keyOrState === 'object') {
		for (const targetKey in state) {
			state[targetKey] = keyOrState[targetKey] ?? state[targetKey]
		}
	} else {
		state[keyOrState] = value
	}
}



/* moveTarget */
// controls how elements are displayed and hidden
// 控制元素的显示和隐藏
export function showOrHideContourPoint (pointElements, isShow) {
  for (const key in pointElements) {
    setStyle(pointElements[key], 'display', isShow ? 'block' : 'none')
  }
}
function checkIsContains (target, pointElements, targetState, stateManager, event) {
	const {
		coordinate, downPointPosition,
		pointState,
		options: { pointSize, skill },
		allContainer, publicTarget, privateTarget
	} = stateManager.getStateByEle(target)

	// 如果点击目标元素是容器则隐藏轮廓点
	if ([...allContainer, document.body, document.documentElement].includes(event.target)) {
		showOrHideContourPoint(pointElements, false)
    // 隐藏轮廓点时让当前选中的元素的层级恢复到正常状态（因为锁定状态不能被选中，所以不需要判断锁定的状态）
		privateTarget === publicTarget.value && setStyle(publicTarget.value, 'zIndex', getTargetZIndex(TargetStatus.Normal, publicTarget.value))
	}

	// 每注册一个元素，window就多绑定一个事件，点击时也会触发window绑定的其他元素对应的mousedown事件，
	// 判断事件目标与绑定的元素是否相同，如果不同不响应操作
	if (event.target !== target) return

	// skill.resize关闭时不需要显示轮廓点，就不需要更新位置
  const pointPosition = skill.resize && updatePointPosition(
    { direction: 't', movementX: 0, movementY: 0 },
    { coordinate, pointElements, pointSize, pointState },
    { excludeCurPoint: false, updateDirection: false }
  )
  // 更新downPointPosition
  for (const pointKey in pointPosition) {
    downPointPosition[pointKey] = [pointPosition[pointKey][0], pointPosition[pointKey][1]]
  }

  // outline points are displayed when in focus
  // 聚焦时将显示轮廓点（多选的情况下不需要显示轮廓点）
	showOrHideContourPoint(pointElements, !stateManager.isRegionSelection)
  // 设置选中元素的层级
  setStyle(target, 'zIndex', getTargetZIndex(TargetStatus.Checked, target))
}
// control the focus and out-of-focus display of the target element's outline points
// 控制目标元素轮廓点的焦点和失焦显示
export function blurOrFocus(pointElements, targetState, stateManager) {
  let checkIsContainsTarget
  return (target: HTMLElement, isBind = true) => {
    if (isBind) {
      window.addEventListener('mousedown', checkIsContainsTarget ?? (checkIsContainsTarget = checkIsContains.bind(null, target, pointElements, targetState, stateManager)))
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



/* movePoint */
// updates the coordinates and dimensions of the target element
// 更新目标元素的坐标和尺寸
export function updateTargetStyle(target, { direction, movementX, movementY }, { targetState, coordinate }) {
  const pointStrategies = memoizeCreateCoordinateStrategies()
  // the browser calculates and updates the element style information with each frame update to avoid unnecessary calculations
  // 浏览器在每次帧更新时计算并更新元素样式信息，以避免不必要的计算
  const styleData = pointStrategies[direction]({
    left: coordinate.left,
    top: coordinate.top,
    width: coordinate.width,
    height: coordinate.height,
    offsetX: movementX,
    offsetY: movementY
  })

	whetherUpdateState(direction, targetState, styleData)

  setStyle(target, styleData)
	return styleData
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

/**
 * @description drag an outline point to resize it, update coordinate information of outline points synchronously
 * @desc 拖拽某个轮廓点调整大小时，同步更新轮廓点的坐标信息
 * @param target 参考元素
 * @param direction 调整大小时按下的轮廓点
 * @param movementX 按下的轮廓点水平方向移动的距离
 * @param movementY 按下的轮廓点竖直方向移动的距离
 * @param initialTarget 参考元素在调整大小前的尺寸和坐标信息
 * @param pointElements 所有的轮廓点
 * @param pointSize 轮廓点的大小
 * @param pointState 轮廓点的状态
 * @param updateOption { excludeCurPoint: boolean, updateDirection: boolean } 更新的配置项
 * excludeCurPoint: 是否排除当前轮廓点（例如按下左下角轮廓点调整大小时，其他轮廓点的坐标是根据这个轮廓点的移动信息更新的，因此不需要更新这个轮廓点的坐标）
 * updateDirection: 按下某个轮廓点时，pointState对应的状态也会更新，updateDirection控制其是否更新
 */
export function updatePointPosition({ direction, movementX, movementY }, { coordinate, pointElements, pointSize, pointState }, updateOption: any = {}) {
	const { excludeCurPoint = true, updateDirection = true } = updateOption
  const paramStrategies = memoizeCreatePositionStrategies()
  // obtain the latest coordinate and dimension information of target. Different strategies are used
  // to calculate coordinates and dimensions at different points
  // 获取目标元素的最新坐标和尺寸信息。使用不同的策略计算不同点的坐标和尺寸
  const newCoordinate = paramStrategies[direction]({ ...coordinate, movementX, movementY })
  // set the position of the contour points based on the new coordinates and dimension information
  // 根据新的坐标和尺寸信息设置轮廓点的位置
  const pointPosition = createParentPosition(newCoordinate, pointSize)

  for (const innerDirection in pointPosition) {
    // there is no need to update the current drag point
    // 不需要更新当前拖拽的点
    if (innerDirection === direction) {
      const newState = {
        direction: updateDirection ? direction : null,
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
    setPosition(pointElements[innerDirection], pointPosition as any, innerDirection as Direction)
  }
	if (!excludeCurPoint) {
		setPosition(pointElements[direction], pointPosition as any, direction as Direction)
	}
  return pointPosition
}
// limits the minimum size of the target element
// 限制目标元素的最小尺寸
export function limitTargetResize (target, { direction, movementX, movementY }, { coordinate, containerInfo, minWidth, minHeight, maxWidth, maxHeight }) {
  // a policy to limit the minimum size when resizing a target
  // 调整目标大小时限制最小尺寸的策略
	// TODO 缓存优化
  const resizeLimitStrategies = createResizeLimitStrategies({ minWidth, minHeight, maxWidth, maxHeight }, { coordinate, containerInfo })
  resizeLimitStrategies[direction]({ movementX, movementY })
}



/* ready to drag and resize - 准备拖动和调整大小 */
// get coordinates and size information based on dom elements
// 获取基于dom元素的坐标和大小信息
export function getCoordinateByElement (element: HTMLElement) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop
  }
}

// creates/updates objects that record coordinate and dimension information for target elements
// 创建/更新记录目标元素坐标和维度信息的对象
export function updateInitialTarget (targetCoordinate?, newCoordinate?) {
  if (targetCoordinate && newCoordinate) {
		updateState(targetCoordinate, newCoordinate)
  }
  return {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		id: generateID()
	}
}

export function saveDownPointPosition({ downPointPosition, pointElements }) {
	// the coordinates of all contour points are recorded when the target element is pressed
	// 当按下目标元素时，记录所有轮廓点的坐标
	for (const key in pointElements) {
		downPointPosition[key] = [parseInt(pointElements[key].style.left), parseInt(pointElements[key].style.top)]
	}
}

export function initTargetStyle (target, size, position) {
  // ensure element absolute positioning
  // 确保元素绝对定位
  setStyle(target, 'position', 'absolute')
  setStyle(target, numberToStringSize(position))
  initDescribe().needInitSize && setStyle(target, numberToStringSize(size))
  function initDescribe() {
    return {
      needInitSize: target.offsetWidth === 0 || target.offsetHeight === 0,
      needInitPosition: getComputedStyle(target).position !== 'absolute'
    }
  }
}

// Saves the initial data of the target element
// 保存目标元素的初始化数据
export function saveInitialData (target, initialTarget) {
	// 直接获取相对于父元素的坐标
	const rect = {
		left: target.offsetLeft,
		top: target.offsetTop,
		width: target.offsetWidth,
		height: target.offsetHeight
	}
	// 处理坐标对象
	if (initialTarget.isCoordinate) {
		for (const key of ['left', 'top', 'width', 'height']) {
			initialTarget[key] = rect[key] || initialTarget[key]
		}
	}
}

export function getPointValue(obj, key) {
	if (!obj.direction) return null
	return obj[key]
}

// 轮廓点超出body不显示滚动条
export function fixContourExceed() {
	document.body.style.overflow = 'hidden'
}

// 为参考线、距离提示添加辅助方法
export function mountAssistMethod(element: HTMLElement) {
	element.show = function(coordinate) {
		if (coordinate) {
			this.style.width = coordinate.width + 'px'
			this.style.height = coordinate.height + 'px'
			this.style.left = coordinate.left + 'px'
			this.style.top = coordinate.top + 'px'
		}
		this.style.display = 'block'
	}
	element.showLong = function (coordinate, containerInfo) {
		if (coordinate.width === 1) {
			this.style.width = coordinate.width + 'px'
			this.style.height = containerInfo.height + 'px'
			this.style.left = coordinate.left + 'px'
			this.style.top = containerInfo.relBodyOffsetTop + 'px'
		} else if (coordinate.height === 1) {
			this.style.width = containerInfo.width + 'px'
			this.style.height = coordinate.height + 'px'
			this.style.left = containerInfo.relBodyOffsetLeft + 'px'
			this.style.top = coordinate.top + 'px'
		}
		this.style.display = 'block'
	}
	element.hide = function() {
		this.style.display = 'none'
	}
	element.isShow = function() {
		return this.style.display !== 'none'
	}
}

// 整理参数
export function tidyOptions(options: MagicDragOptions) {
	// pointSize的优先级高于pointStyle.width
	options.pointSize = options.pointSize || parseInt(options.customStyle.pointStyle.width) || parseInt(options.customStyle.pointStyle.height)
	return options
}
