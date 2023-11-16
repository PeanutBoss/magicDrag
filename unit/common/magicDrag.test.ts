import {
	getDirectionDescription,
	createCoordinateStrategies,
	memoizeCreateCoordinateStrategies,
	createPositionStrategies,
	memoizeCreatePositionStrategies
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

		// 在 100,100 位置的尺寸为 200, 200 的元素，以左上方为基点缩放，x轴方向缩小50，y轴方向放大50
		const ltStyle = coordinateStrategy['lt']({ left: 100, top: 100, height: 200, width: 200, offsetX: 50, offsetY: -50 })
		expect(ltStyle).toEqual({ left: '150px', top: '50px', width: '150px', height: '250px' })

		// 在 100,100 位置的尺寸为 200, 200 的元素，以右下方为基点缩放，x轴方向放大50，y轴方向缩小50
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

		// 在 100,100 位置的尺寸为 200, 200 的元素，以左上方为基点缩放，x轴方向缩小50，y轴方向缩小50
		const ltData = positionStrategy['lt']({ left: 100, top: 100, width: 200, height: 200, movementX: 50, movementY: 50 })
		expect(ltData).toEqual({ left: 150, top: 150, width: 150, height: 150 })

		// 在 100,100 位置的尺寸为 200, 200 的元素，以左上方为基点缩放，x轴方向放大50，y轴方向放大50
		const rbData = positionStrategy['rb']({ left: 100, top: 100, width: 200, height: 200, movementX: 50, movementY: 50 })
		expect(rbData).toEqual({ left: 100, top: 100, width: 250, height: 250 })
	})

})
