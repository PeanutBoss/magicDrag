import { Plugin } from './index.ts'
import useMovePoint from "../useMovePoint.ts";
import {blurOrFocus, moveTargetCallback} from "../utils/dragResize";
import { watch } from "vue";

class Drag implements Plugin {
	name: 'Drag'
	init(elementParameter, stateParameter, globalDataParameter, options) {
		console.log(elementParameter, stateParameter, globalDataParameter, options)
		// 显示或隐藏轮廓点的方法
// 		const processBlurOrFocus = blurOrFocus(pointElements, targetState)
// 		processBlurOrFocus(target)
// 		if (!drag) return
// 		const { movementX, movementY, isPress } = useMovePoint(
// 			target,
// 			moveTargetCallback(dragCallback, {
// 				downPointPosition, pointElements, targetState, initialTarget, containerInfo
// 			}),
// 			{ direction: limitDragDirection })
// 		watch(isPress, isPressChangeCallback({ downPointPosition, movementX, movementY }))
	}
	unbind(target: HTMLElement) {
	}
}

export default new Drag()
