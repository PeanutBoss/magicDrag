import { ref } from 'vue'
import {
	getDirectionDescription,
	createCoordinateStrategies,
	memoizeCreateCoordinateStrategies,
	createPositionStrategies,
	memoizeCreatePositionStrategies,
	createResizeLimitStrategies,
	createParentPosition,
	setPosition,
	updateState,
	updateInitialTarget,
	updatePointPosition
} from '../../magicDrag/common/magicDrag'

describe('Drag and drop related helper functions.', () => {

	it('Get the direction description based on the direction', () => {
		const direction = 'lt'
		const direDesc = getDirectionDescription(direction)
		for (const dire in direDesc) {
			const lastStr = dire.substring(3).toLowerCase()
			expect(direDesc[dire]).toBe(direction.indexOf(lastStr) > -1)
		}
	})

	it('Creates a strategy for moving contour points to update coordinate and dimension information for target elements', () => {
		const coordinateStrategy = memoizeCreateCoordinateStrategies()
		const anotherCoordinateStrategy = memoizeCreateCoordinateStrategies()
		expect(coordinateStrategy).toBe(anotherCoordinateStrategy)

		const coordinateStrategyCopy = createCoordinateStrategies()
		expect(coordinateStrategy).not.toBe(coordinateStrategyCopy)
		expect(anotherCoordinateStrategy).not.toBe(coordinateStrategyCopy)

		// 在 100,100 位置的尺寸为 200 * 200 的元素，以左上方为基点缩放，x轴方向缩小50，y轴方向放大50
		const ltStyle = coordinateStrategy['lt']({ left: 100, top: 100, height: 200, width: 200, offsetX: 50, offsetY: -50 })
		expect(ltStyle).toEqual({ left: '150px', top: '50px', width: '150px', height: '250px' })

		// 在 100,100 位置的尺寸为 200 * 200 的元素，以右下方为基点缩放，x轴方向放大50，y轴方向缩小50
		const rbStyle = coordinateStrategy['rb']({ left: 100, top: 100, height: 200, width: 200, offsetX: 50, offsetY: -50 })
		expect(rbStyle).toEqual({ left: '100px', top: '100px', width: '250px', height: '150px' })
	})

	it('Create a policy to update the position of contour points after modifying the size or coordinates of the target element', () => {
		const positionStrategy = memoizeCreatePositionStrategies()
		const anotherPositionStrategy = memoizeCreatePositionStrategies()
		expect(positionStrategy).toBe(anotherPositionStrategy)

		const positionStrategyCopy = createPositionStrategies()
		expect(positionStrategy).not.toBe(positionStrategyCopy)
		expect(anotherPositionStrategy).not.toBe(positionStrategyCopy)

		// 在 100,100 位置的尺寸为 200 * 200 的元素，以左上方为基点缩放，x轴方向缩小50，y轴方向缩小50
		const ltData = positionStrategy['lt']({ left: 100, top: 100, width: 200, height: 200, movementX: 50, movementY: 50 })
		expect(ltData).toEqual({ left: 150, top: 150, width: 150, height: 150 })

		// 在 100,100 位置的尺寸为 200 * 200 的元素，以右下方为基点缩放，x轴方向放大50，y轴方向放大50
		const rbData = positionStrategy['rb']({ left: 100, top: 100, width: 200, height: 200, movementX: 50, movementY: 50 })
		expect(rbData).toEqual({ left: 100, top: 100, width: 250, height: 250 })
	})

	it('The policy for limiting the maximum and minimum sizes when resizing', () => {
		// 允许的最小尺寸为 100 * 100，允许的最大尺寸为 200 * 200
		const limitParameters = {
			minWidth: 100,
			minHeight: 100,
			maxWidth: 200,
			maxHeight: 200
		}
		// 目标元素当前尺寸为 150 * 150，在 100,100 的位置
		const initialTarget = { width: 160, height: 160, left: 100, top: 100 }
		// 容器元素的尺寸为 500 * 500，没有偏移（即容器元素左上角与body元素左上角重合）
		const containerInfo = { width: 500, height: 500, offsetLeft: 0, offsetTop: 0 }
		const strategies = createResizeLimitStrategies(limitParameters, { initialTarget, containerInfo })

		let movement = { movementX: ref(-150), movementY: ref(-150) }
		// 在 100,100 位置上的尺寸为 160 * 160 的元素，以左上方为基点缩放，鼠标向左移动了150px，向上移动了150px
		strategies['lt'](movement)
		// 限制元素最大尺寸为 200 * 200，movementX & movementY都是-40
		expect(movement.movementX.value).toBe(-40)
		expect(movement.movementY.value).toBe(-40)

		movement = { movementX: ref(-150), movementY: ref(-150) }
		// 在 100,100 位置上的尺寸为 160 * 160 的元素，以右下方为基点缩放，鼠标向左移动了150px，向上移动了150px
		strategies['rb'](movement)
		// 限制元素最小尺寸为 100 * 100，movementX & movementY最大值都是60
		expect(movement.movementX.value).toBe(-60)
		expect(movement.movementY.value).toBe(-60)
	})

	it('Resize limits policies that exceed container scope', () => {
		// 允许的最小尺寸为 100 * 100，允许的最大尺寸为 1000 * 1000
		const limitParameters = {
			minWidth: 100,
			minHeight: 100,
			maxWidth: 1000,
			maxHeight: 1000
		}
		// 目标元素当前尺寸为 160 * 160，在 100,100 的位置
		const initialTarget = { width: 160, height: 160, left: 100, top: 100 }
		// 容器元素的尺寸为 300 * 300，没有偏移（即容器元素左上角与body元素左上角重合）
		const containerInfo = { width: 300, height: 300, offsetLeft: 0, offsetTop: 0 }
		const strategies = createResizeLimitStrategies(limitParameters, { initialTarget, containerInfo })

		// 在 100,100 位置上的尺寸为 160 * 160 的元素，以左上方为基点缩放，鼠标向左移动了150px，向上移动了150px
		let movement = { movementX: ref(-150), movementY: ref(-150) }
		strategies['lt'](movement)
		// 分别向左、向上移动 100px、100px 后，就会抵达容器边界
		expect(movement.movementX.value).toBe(-100)
		expect(movement.movementY.value).toBe(-100)

		// 在 100,100 位置上的尺寸为 160 * 160 的元素，以右下方为基点缩放，鼠标向右移动了150px，向下移动了150px
		movement = { movementX: ref(150), movementY: ref(150) }
		strategies['rb'](movement)
		// 分别向右、向下移动 40px、40px 后，就会抵达容器边界
		expect(movement.movementX.value).toBe(40)
		expect(movement.movementY.value).toBe(40)
	})
})

describe('Some tool methods', () => {

	it('根据元素尺寸和位置信息获取改元素轮廓点的位置信息', () => {
		const posData = createParentPosition({ left: 50, top: 70, width: 100, height: 500 }, 5)
		expect(JSON.stringify(posData)).toBe('{"lt":[47.5,67.5,"nw-resize"],"lb":[47.5,567.5,"ne-resize"],"rt":[147.5,67.5,"ne-resize"],"rb":[147.5,567.5,"nw-resize"],"t":[97.5,67.5,"n-resize","X"],"b":[97.5,567.5,"n-resize","X"],"l":[47.5,317.5,"e-resize","Y"],"r":[147.5,317.5,"e-resize","Y"]}')
	})

	it('Set position information', () => {
		const dom = { style: {} } as HTMLElement
		setPosition(dom, { lt: [10, 20] }, 'lt')
		expect(dom.style.left).toBe('10px')
		expect(dom.style.top).toBe('20px')
	})

	it('A polymorphic method for updating the state of an object', () => {
		const state: any = { name: '', size: 0 }
		updateState(state, { name: 'state', size: 5 })
		updateState(state, 'length', 3)
		expect(state.name).toBe('state')
		expect(state.size).toBe(5)
		expect(state.length).toBe(3)
	})

	it('Updates or gets information that describes the initial state of an element', () => {
		const { id, ...rest } = updateInitialTarget()
		expect(rest).toEqual({ left: 0, top: 0, height: 0, width: 0 })
		expect(typeof id).toBe('string')
	})

	it.skip('调整大小后，更新轮廓点的位置信息', () => {
		const coordinate = { width: 100, height: 100, top: 20, left: 20 }
		const pointElements = createPointElements()
		const pointState = createPointState()
		// 尺寸为100 * 100，在 20, 20 位置的元素以左上角为基点，在x和y轴方向各缩小了10px
		updatePointPosition(
			{ direction: 'lt', movementX: 10, movementY: 10 },
			{ coordinate, pointElements, pointSize: 10, pointState }
		)
		console.log(pointElements)
		console.log(pointState)
		function createPointElements() {
			const pointElements = {};
				['l', 't', 'r', 'b', 'lt', 'lb', 'rt', 'rb'].forEach(direction => {
				pointElements[direction] = document.createElement('div')
			})
			return pointElements
		}
		function createPointState() {
			const pointState = {};
			['l', 't', 'r', 'b', 'lt', 'lb', 'rt', 'rb'].forEach(direction => {
				pointState[direction] = 0
			})
			return pointState
		}
	})
})
