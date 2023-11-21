import { addGlobalUnmountCb, unMountGlobalCb } from '../../magicDrag/common/globalData'

describe('Global unmount callbacks', () => {
	it('Counter should be 1', () => {
		let counter = 0
		const increment = () => counter++
		const decrement = () => counter--
		addGlobalUnmountCb(increment)
		addGlobalUnmountCb(increment)
		addGlobalUnmountCb(decrement)

		unMountGlobalCb()
		expect(counter).toBe(1)
	})
})
