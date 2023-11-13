import { checkParameterType, checkParameterValue } from '../../magicDrag/common/warningAssist'
import globalData from '../../magicDrag/common/globalData'
import {mergeObject} from "../../magicDrag/utils/tools";

describe('parameters check', function () {
	it('Check that all field types of the parameter are the same', () => {
		const exampleParameter = {
			str: 'string',
			num: 5,
			arr: ['arr'],
			obj: {},
			fun: () => {}
		}
		expect(() => checkParameterType(exampleParameter, { str: 5 }))
			.toThrow(`The type of options.str should be string, But the number type is passed in.`)
		expect(() => checkParameterType(exampleParameter, { num: {} }))
			.toThrow(`The type of options.num should be number, But the object type is passed in.`)
		expect(() => checkParameterType(exampleParameter, { arr: '' }))
			.toThrow(`The type of options.arr should be array, But the string type is passed in.`)
		expect(() => checkParameterType(exampleParameter, { obj: [] }))
			.toThrow(`The type of options.obj should be object, But the array type is passed in.`)
		expect(() => checkParameterType(exampleParameter, { fun: {} }))
			.toThrow(`The type of options.fun should be function, But the object type is passed in.`)
	})

	it('Check whether the parameter "initialInfo" field value is valid', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		checkParameterValue(mergeObject(globalData.defaultOptions, { initialInfo: { left: -1, top: 5 } }))
		expect(console.warn).toHaveBeenCalled()
		expect(console.warn.mock.calls[0][0]).toContain('It is not recommended that the initial location information be set to a negative value')
		console.warn = originWarn
	})

	it('Exchange error field values', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		const options = mergeObject(globalData.defaultOptions, { minWidth: 20, maxWidth: 10, minHeight: 30, maxHeight: 20 })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalled()
		expect(console.warn.mock.calls[0][0]).toContain('The maximum value cannot be less than the minimum value, and the maximum and minimum values have been replaced with each other')
		expect(options.minWidth).toBe(10)
		expect(options.maxWidth).toBe(20)
		expect(options.minHeight).toBe(20)
		expect(options.maxHeight).toBe(30)
		console.warn = originWarn
	})

	it('Check the width and height related fields', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		checkParameterValue(mergeObject(globalData.defaultOptions, { initialInfo: { height: 50 }, minHeight: 100 }))
		checkParameterValue(mergeObject(globalData.defaultOptions, { initialInfo: { height: 200 }, maxHeight: 100 }))
		expect(console.warn).toHaveBeenCalledTimes(2)
		expect(console.warn.mock.calls[0][0]).toContain('The initial size cannot be less than the minimum size')
		expect(console.warn.mock.calls[1][0]).toContain('The initial size cannot be greater than the maximum size')
		console.warn = originWarn
	})
})
