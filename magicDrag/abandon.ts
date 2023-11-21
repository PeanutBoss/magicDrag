/*
// 废弃 - 窗口大小发生变化时更新遮挡住的元素位置
function listenContainerSize() {
	const oldTargetLeft = stateManager.currentState.globalDataParameter.initialTarget.left
	saveContainerSizeAndOffset(contentAreaSize(), contentAreaOffset())
	// resize后更新轮廓点位置
	needUpdateTargetPos(stateManager.currentState.globalDataParameter.containerInfo.width) && updateTargetPos()

	function needUpdateTargetPos(newContainerWidth) {
		const targetRightSide = oldTargetLeft + stateManager.currentState.globalDataParameter.initialTarget.width
		// resize后目标元素如果会被遮挡就需要更新位置
		return targetRightSide > newContainerWidth
	}
	function newLeft(newContainerWidth) {
		// resize后的容器尺寸 - 目标元素宽度
		const resizeAfterLeft = newContainerWidth - stateManager.currentState.globalDataParameter.initialTarget.width
		return resizeAfterLeft >= 0 ? resizeAfterLeft : 0
	}
	function updateTargetPos() {
		updateInitialTarget(
			stateManager.currentState.globalDataParameter.initialTarget,
			{ ...stateManager.currentState.globalDataParameter.initialTarget, left: newLeft(stateManager.currentState.globalDataParameter.containerInfo.width) }
		)
		setStyle(stateManager.currentElement, numberToStringSize(stateManager.currentState.globalDataParameter.initialTarget))
		// 隐藏轮廓点
		showOrHideContourPoint(stateManager.currentState.elementParameter.pointElements, false)
	}
}
*/
