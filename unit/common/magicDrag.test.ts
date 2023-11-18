import { ref } from 'vue'
import {
	getDirectionDescription,
	createCoordinateStrategies,
	memoizeCreateCoordinateStrategies,
	createPositionStrategies,
	memoizeCreatePositionStrategies,
	createResizeLimitStrategies
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

	it('调整大小时对最大和最小尺寸的限制策略', () => {
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

	it('调整大小时超出容器范围的限制策略', () => {
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
