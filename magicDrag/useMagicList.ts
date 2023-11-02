import { mergeObject, baseErrorTips, notSelectorAndHTML } from './utils/tools'
import { MAGIC_DRAG } from './style/className'
import { usePlugin } from './manager'
import globalData, { MagicDragOptions } from './common/globalData'
import { tidyOptions } from './common/functionAssist'
import { checkParameterType, checkParameterValue } from './common/warningAssist'
import { useMagicDragAPI } from './core'

interface SelectDescribe {
	selector: string
	initialPosition: Record<'left' | 'top', number>
	initialSize: Record<'width' | 'height', number>
}
type MagicSelector = string | HTMLElement | SelectDescribe

function formatSelectors(targetSelectors: MagicSelector[]) {
	const selectors = []
	const initInfos = []
	targetSelectors.forEach(magicSel => {
		if (typeof magicSel === 'object') {
			selectors.push((magicSel as SelectDescribe).selector)
			initInfos.push(mergeObject(mergeObject({}, magicSel.initialPosition), magicSel.initialSize))
			return
		}
		selectors.push(magicSel)
		initInfos.push({})
	})
}

export function useMagicList(
	targetSelectors: MagicSelector[],
	options?: MagicDragOptions
) {
	// formatSelectors(targetSelectors)

	const hasCorrectType = targetSelectors.some(selector => notSelectorAndHTML(selector))
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

	let state
	targetSelectors.forEach(selector => {
		state = useMagicDragAPI(selector, options)
	})
	return state
}

