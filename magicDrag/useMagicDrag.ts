import { MagicDragOptions, defaultOptions } from './common/globalData'
import {baseErrorTips, mergeObject} from './utils/tools'
import {checkParameterType, checkParameterValue} from './common/warningAssist'
import {tidyOptions} from './common/magicDrag'
import {usePlugin} from './manager'
import {MAGIC_DRAG} from './style/className'
import {useMagicDragAPI} from './core'

export function useMagicDrag(
	targetSelector: string | HTMLElement,
	options?: MagicDragOptions
) {
	// check whether targetSelector is a selector or an HTMLElement
	// 检查 targetSelector 是否为选择器或 HTMLElement
	const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
	baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

	checkParameterType(defaultOptions(), options)
	checkParameterValue(options)

	options = tidyOptions(mergeObject(defaultOptions(), options))
	usePlugin(options)
	baseErrorTips(
		options.customClass.customPointClass.startsWith(MAGIC_DRAG),
		`custom class names cannot start with ${MAGIC_DRAG}, please change your class name`
	)

	return useMagicDragAPI(
		targetSelector,
		options
	)
}
