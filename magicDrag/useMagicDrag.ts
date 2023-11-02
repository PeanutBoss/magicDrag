import globalData, {MagicDragOptions} from "./common/globalData";
import {baseErrorTips, mergeObject} from "./utils/tools";
import {checkParameterType, checkParameterValue} from "./common/warningAssist";
import {tidyOptions} from "./common/functionAssist";
import {usePlugin} from "./manager";
import {MAGIC_DRAG} from "./style/className";
import {useMagicDragAPI} from "./core";

export function useMagicDrag(
	targetSelector: string | HTMLElement,
	options?: MagicDragOptions
) {
	// check whether targetSelector is a selector or an HTMLElement
	// 检查 targetSelector 是否为选择器或 HTMLElement
	const CorrectParameterType = typeof targetSelector !== 'string' && !(targetSelector instanceof HTMLElement)
	baseErrorTips(CorrectParameterType, 'targetSelector should be a selector or HTML Element')

	checkParameterType(globalData.defaultOptions, options)
	checkParameterValue(options)

	options = tidyOptions(mergeObject(globalData.defaultOptions, options))
	// TODO usePlugin应该提到API外面，但需要用处理后的options参数
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
