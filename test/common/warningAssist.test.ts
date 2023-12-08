import { checkParameterType, checkParameterValue } from '../../magicDrag/common/warningAssist'
import { defaultOptions } from '../../magicDrag/common/globalData'
import {mergeObject} from "../../magicDrag/utils/tools";

describe('parameters check', function () {
	it('Check whether the field value types in the parameters meet the expectations.', () => {
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

	it('Check whether the parameter "initialInfo" field value is valid.', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		const options = mergeObject(defaultOptions(), { initialInfo: { left: 10, top: -20 } })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalled()
		expect(console.warn.mock.calls[0][0]).toContain('It is not recommended that the initial location information be set to a negative value.')
		expect(options.initialInfo.left).toBe(10)
		expect(options.initialInfo.top).toBe(0)
		console.warn = originWarn
	})

	it('Exchange error field values.', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		const options = mergeObject(defaultOptions(), { minWidth: 20, maxWidth: 10, minHeight: 30, maxHeight: 20 })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalled()
		expect(console.warn.mock.calls[0][0]).toContain('The maximum value cannot be less than the minimum value, and the maximum and minimum values have been replaced with each other.')
		expect(options.minWidth).toBe(10)
		expect(options.maxWidth).toBe(20)
		expect(options.minHeight).toBe(20)
		expect(options.maxHeight).toBe(30)
		console.warn = originWarn
	})

	it('Check the width and height related fields.', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		checkParameterValue(mergeObject(defaultOptions(), { initialInfo: { height: 50 }, minHeight: 100 }))
		checkParameterValue(mergeObject(defaultOptions(), { initialInfo: { height: 200 }, maxHeight: 100 }))
		expect(console.warn).toHaveBeenCalledTimes(2)
		expect(console.warn.mock.calls[0][0]).toContain('The initial size cannot be less than the minimum size.')
		expect(console.warn.mock.calls[1][0]).toContain('The initial size cannot be greater than the maximum size.')
		console.warn = originWarn
	})

	it('Check that the value of the customStyle.pointStyle field is valid', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		expect(() => checkParameterValue(mergeObject(defaultOptions(), { customStyle: { pointStyle: { width: '20' } } })))
			.toThrow('The dimensions of the outline points are supported only in px units.')
		const options = mergeObject(defaultOptions(), { customStyle: { pointStyle: { position: 'relative', display: 'block', boxSizing: 'content-box' } } })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalledTimes(3)
		expect(console.warn.mock.calls[0][0]).toContain('PointStyle.position the expected value is absolute and is automatically modified')
		expect(console.warn.mock.calls[1][0]).toContain(`If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
		expect(console.warn.mock.calls[2][0]).toContain(`If the contour point box-sizing property is not set to border-box, the contour point position may be shifted.`)
		expect(options.customStyle.pointStyle.position).toBe('absolute')
		expect(options.customStyle.pointStyle.display).toBe('none')
		expect(options.customStyle.pointStyle.boxSizing).toBe('border-box')
		console.warn = originWarn
	})

	it('Check that the value of the customStyle.refLineStyle field is valid', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		const options = mergeObject(defaultOptions(), { customStyle: { refLineStyle: { width: '1', position: 'relative', display: 'block' } } })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalledTimes(3)
		expect(console.warn.mock.calls[0][0]).toContain('The guide size cannot be set. It has been moved and deleted.')
		expect(console.warn.mock.calls[1][0]).toContain('RefLineStyle.position the expected value is absolute and is automatically modified.')
		expect(console.warn.mock.calls[2][0]).toContain(`If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
		expect(options.customStyle.refLineStyle.width).toBeUndefined()
		expect(options.customStyle.refLineStyle.height).toBeUndefined()
		expect(options.customStyle.refLineStyle.position).toBe('absolute')
		expect(options.customStyle.refLineStyle.display).toBe('none')
		console.warn = originWarn
	})

	it('Check that the value of the customStyle.tipStyle field is valid', () => {
		const originWarn = console.warn
		console.warn = jest.fn()
		const options = mergeObject(defaultOptions(), { customStyle: { tipStyle: { position: 'relative', display: 'block', boxSizing: 'content-box' } } })
		checkParameterValue(options)
		expect(console.warn).toHaveBeenCalledTimes(3)
		expect(console.warn.mock.calls[0][0]).toContain('TipStyle.position the expected value is absolute and is automatically modified.')
		expect(console.warn.mock.calls[1][0]).toContain(`If you do not set the display property of the outline point to none,
      redundant elements may be displayed after the initial rendering is complete.`)
		expect(console.warn.mock.calls[2][0]).toContain(`If the contour point box-sizing property is not set to border-box, the contour point position may be shifted.`)
		expect(options.customStyle.tipStyle.position).toBe('absolute')
		expect(options.customStyle.tipStyle.display).toBe('none')
		expect(options.customStyle.tipStyle.boxSizing).toBe('border-box')
		console.warn = originWarn
	})
})
