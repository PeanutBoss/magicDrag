import { mergeObject, baseErrorTips, notSelectorAndHTML } from './utils/tools'
import { MAGIC_DRAG } from './style/className'
import { usePlugin } from './manager'
import globalData, { MagicDragOptions } from './common/globalData'
import { tidyOptions } from './common/functionAssist'
import { checkParameterType, checkParameterValue } from './common/warningAssist'
import { useMagicDragAPI } from './core'

export interface SelectDescribe {
	selector: string
	initialPosition: Record<'left' | 'top', number>
	initialSize: Record<'width' | 'height', number>
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

	const hasCorrectType = selectors.some(selector => notSelectorAndHTML(selector))
	baseErrorTips(hasCorrectType,
		`targetSelectors receive an array of tag selectors or HTML elements,
		but the passed targetSelectors contain the value of the unexpected type`)

	checkParameterType(globalData.defaultOptions, options)
	checkParameterValue(options)
	options = tidyOptions(mergeObject(globalData.defaultOptions, options))
	usePlugin(options)
	baseErrorTips(
		options.customClass.customPointClass.startsWith(MAGIC_DRAG),
		`custom class names cannot start with ${MAGIC_DRAG}, please change your class name`
	)

	console.log(selectors, 'selectors')
	console.log(initialInfos, 'initialInfos')
	let state
	selectors.forEach((selector, index) => {
		state = useMagicDragAPI(selector, mergeObject(options, { initialInfo: initialInfos[index] }))
	})
	return state
}

