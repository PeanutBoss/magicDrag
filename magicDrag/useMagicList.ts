import { mergeObject, baseErrorTips, notSelectorAndHTML } from './utils/tools'
import { MAGIC_DRAG } from './style/className'
import { usePlugin } from './manager'
import { MagicDragOptions, defaultOptions } from './common/globalData'
import { tidyOptions } from './common/magicDrag'
import { checkParameterType, checkParameterValue, checkOptionSize } from './common/warningAssist'
import { useMagicDragAPI } from './core'

export interface SelectDescribe {
	selector: string
	initialPosition?: Record<'left' | 'top', number>
	initialSize?: Record<'width' | 'height', number>
}
type MagicSelector = string | HTMLElement | SelectDescribe

function preventMistakeParameter(parameter: MagicSelector[]) {
	parameter.forEach(item => {
		if (!notSelectorAndHTML(item)) return
		// @ts-ignore
		item.initialSize = item.initialSize || {}
		// @ts-ignore
		item.initialPosition = item.initialPosition || {}
	})
}

function formatSelectors(targetSelectors: MagicSelector[]) {
	const selectors = []
	const initialInfos = []
	targetSelectors.forEach(magicSel => {
		if (typeof magicSel === 'object') {
			selectors.push((magicSel as SelectDescribe).selector)
			// @ts-ignore
			initialInfos.push(mergeObject({}, { ...magicSel.initialPosition, ...magicSel.initialSize }))
			return
		}
		selectors.push(magicSel)
		initialInfos.push({})
	})
	return { selectors, initialInfos }
}

export function useMagicList(
	targetSelectors: MagicSelector[],
	options?: MagicDragOptions
) {
	preventMistakeParameter(targetSelectors)
	const { selectors, initialInfos } = formatSelectors(targetSelectors)

	initialInfos.forEach(initialInfo => checkOptionSize({
		initialInfo,
		maxHeight: options?.maxHeight ?? defaultOptions().maxHeight,
		minHeight: options?.minHeight ?? defaultOptions().minHeight,
		maxWidth: options?.maxWidth ?? defaultOptions().maxWidth,
		minWidth: options?.minWidth ?? defaultOptions().minWidth
	}))

	const hasCorrectType = selectors.some(selector => notSelectorAndHTML(selector))
	baseErrorTips(hasCorrectType,
		`targetSelectors receive an array of tag selectors or HTML elements,
		but the passed targetSelectors contain the value of the unexpected type`)

	checkParameterType(defaultOptions(), options)
	checkParameterValue(options)
	options = tidyOptions(mergeObject(defaultOptions(), options))
	usePlugin(options)
	baseErrorTips(
		options.customClass.customPointClass.startsWith(MAGIC_DRAG),
		`custom class names cannot start with ${MAGIC_DRAG}, please change your class name`
	)

	let state
	selectors.forEach((selector, index) => {
		state = useMagicDragAPI(selector, mergeObject(options, { initialInfo: initialInfos[index] }))
	})

	// 参数检查
	function insertElement(selector: MagicSelector) {
		if (typeof selector === 'string' || selector instanceof HTMLElement)
			return useMagicDragAPI(selector, options)

		if (typeof selector === 'object') {
			const initialInfo = { ...selector.initialSize, ...selector.initialPosition }
			checkOptionSize(mergeObject(options, initialInfo))
			return useMagicDragAPI(selector.selector, { ...options, initialInfo })
		}
	}

	state.insertElement = insertElement

	return state
}

export function useMagicDrag(targetSelector, options) {
	return useMagicList([targetSelector], options)
}
