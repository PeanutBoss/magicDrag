import Shortcut from './shortcut'

function cloneDeep(raw) {
	return raw
}

function createSnapshotType(SnapshotType = {}) {
	SnapshotType[SnapshotType['remove'] = 'append'] = 'remove'
	SnapshotType[SnapshotType['copy'] = 'remove'] = 'append'
	SnapshotType['view'] = 'view'
	SnapshotType['style'] = 'style'
	SnapshotType['order'] = 'order'
	SnapshotType['textEdit'] = 'textEdit'
	SnapshotType['rename'] = 'rename'
	SnapshotType['upload'] = 'upload'
	SnapshotType['drag'] = 'drag'
	SnapshotType['resize'] = 'resize'
	SnapshotType['toTop'] = 'toTop'
	return SnapshotType
}
const SnapshotType = createSnapshotType()

// 标识操作记录为空 或 undo到第一步了
const HAS_NOT_RECORDS = -1

/**
 * 创建UndoRedo
 * @param actions { Record<'remove' | 'copy' | 'append', Function> }
 * @param callbacks
 * @returns {{new(*): UndoRedo, _initialSnapshot: *, _snapshotIndex: number, _snapshotRecords: [], prototype: UndoRedo}}
 */
function createUndoRedo(actions, callbacks) {
	return class UndoRedo {
		private _initialSnapshot
		private _snapshotIndex
		private _snapshotRecords
		constructor(initialSnapshot) {
			this._initialSnapshot = cloneDeep(initialSnapshot)
			this._snapshotIndex = HAS_NOT_RECORDS
			this._snapshotRecords = []
			this.startListen()
		}
		startListen() {
			const shortcut = new Shortcut()
			shortcut.registerShortcut('z', event => {
				if (!event.ctrlKey) return
				this.undo()
			}, { type: Shortcut.KEY_UP })
			shortcut.registerShortcut('y', event => {
				if (!event.ctrlKey) return
				this.redo()
			}, { type: Shortcut.KEY_UP })

			// 阻止默认操作
			shortcut.registerShortcut('z', event => {
				if (!event.ctrlKey) return
				event.preventDefault()
			}, { type: Shortcut.KEY_DOWN })
			shortcut.registerShortcut('y', event => {
				if (!event.ctrlKey) return
				event.preventDefault()
			}, { type: Shortcut.KEY_DOWN })
			shortcut.startListen()
		}
		push(chartData, type) {
			// 添加一条新的记录
			this._snapshotRecords[this._snapshotIndex + 1] = { type, chartData: cloneDeep(chartData) }
			// 如果 _snapshotIndex 指向的不是最后一条记录，需要删除后面的操作
			if (!this.isLastRecord) this._snapshotRecords.splice(this._snapshotIndex + 2)
			this._snapshotIndex++
		}
		async redo() {
			if (this._snapshotIndex > this._snapshotRecords.length - 2) return
			const snapshot = this._snapshotRecords[++this._snapshotIndex]
			// 相当于取反两次，copy操作redo时相当于append
			const actionType = SnapshotType[SnapshotType[snapshot.type]]
			// 下一次的状态快照
			let nextChartData = this.findNextSnapshot(snapshot.chartData)

			if (snapshot.chartData.effectList?.length) {
				const updateEffectList = []
				snapshot.chartData.effectList.forEach(item => {
					updateEffectList.push(this.findEffectNextData(item))
				})
				nextChartData = { ...nextChartData, effectList: updateEffectList }
			}

			await actions[actionType](snapshot.chartData, true, { ...nextChartData })
			const updateIds = nextChartData.effectList ? [snapshot.chartData.tableId, ...nextChartData.effectList.map(m => m.tableId)] : [snapshot.chartData.tableId]
			callbacks.redoCallback(updateIds)
		}
		async undo() {
			if (this._snapshotIndex < 0) return
			const snapshot = this._snapshotRecords[this._snapshotIndex]
			// 去操作记录中操作类型的相反操作
			const actionType = SnapshotType[snapshot.type]
			// 上一次的状态
			let preChartData = this.findPreSnapshot(snapshot.chartData, 'actionType')

			if (snapshot.chartData.effectList?.length) {
				const updateEffectList = []
				snapshot.chartData.effectList.forEach(item => {
					// TODO findEffectPreData 如果要找上一次的状态就不应该包含当前的chartData
					updateEffectList.push(this.findEffectPreData(item))
				})
				// 实际上 updateEffectList 等于 snapshot.chartData.effectList
				preChartData = { ...preChartData, effectList: updateEffectList }
			}

			await actions[actionType](snapshot.chartData, true, { ...preChartData })
			const updateIds = preChartData?.effectList ? [snapshot.chartData.tableId, ...preChartData.effectList.map(m => m.tableId)] : [snapshot.chartData.tableId]
			this._snapshotIndex--
			callbacks.undoCallback(updateIds)
		}
		// 获取上一次的快照
		findPreSnapshot(chartData) {
			// 找到参数 chartData 在全部chartData中的位置
			const ownIndex = this.wholeChartData.indexOf(chartData)
			// 排除chartData和它之后的数据
			const restChartData = this.wholeChartData.slice(0, ownIndex)
			const preIndex = restChartData.findLastIndex(item => item.tableId === chartData.tableId)
			if (preIndex === -1) return chartData
			return this.wholeChartData[preIndex]
		}
		// 获取下一次的快照
		findNextSnapshot(chartData) {
			const ownIndex = this.wholeChartData.indexOf(chartData)
			const restChartData = this.wholeChartData.slice(ownIndex)
			const nextIndex = restChartData.findIndex(item => item.tableId === chartData.tableId)
			if (nextIndex === -1) return chartData
			return restChartData[nextIndex]
		}
		// 删除一个组件之后执行撤销操作，撤销后会新增一个组件，新增的组件与删除的组件的tableId不同；找到与删除组件tableId相同的所有组件
		findDeleteCite(delChartData) {
			const effectChartData = []
			this._snapshotRecords.forEach(item => {
				if (item.chartData.effectItems) effectChartData.push(...item.chartData.effectItems)
			})
			return [...this.wholeChartData, effectChartData].filter(f => f.tableId === delChartData.tableId)
		}
		recordsSituation() {
			return {
				notLastRecord: this._snapshotIndex !== this._snapshotRecords.length - 1,
				notFirstRecord: this._snapshotIndex !== HAS_NOT_RECORDS
			}
		}
		resetRecords() {
			this._snapshotIndex = HAS_NOT_RECORDS
			this._snapshotRecords = []
			this._initialSnapshot = []
		}
		get snapshot() {
			return this._snapshotRecords.slice()
		}
		get snapshotIndex() {
			return this._snapshotIndex
		}
		get initialSnapshot() {
			return this._initialSnapshot.slice()
		}
		get wholeChartData() {
			return [...this._initialSnapshot, ...this._snapshotRecords.map(m => m.chartData)]
		}
		get isLastRecord() {
			return this._snapshotIndex === this._snapshotRecords.length - 1
		}

		findEffectPreData(effectData) {
			let result
			const records = this._snapshotRecords.slice(0, this._snapshotIndex)
				.reverse() // 应该从后向前找
			result = this._findDataByList(records, effectData)
			// 如果还没有继续在 initialSnapshot 中找
			if (!result) result = this._initialSnapshot.find(item => item.tableId === effectData.tableId)
			return result
		}
		findEffectNextData(effectData) {
			const records = this._snapshotRecords.slice(this._snapshotIndex)
			return this._findDataByList(records, effectData)
		}
		_findDataByList(list, data) {
			let result
			for (let i = 0; i < list.length; i++) {
				const curRecord = list[i]
				if (curRecord.chartData.tableId === data.tableId) {
					result = curRecord.chartData
				}
				// 没找到检查是否有 effectList，如果有就在 effectList 中找
				if (curRecord.chartData?.effectList?.length && !result) {
					curRecord.chartData.effectList.forEach(item => {
						if (item.tableId === data.tableId) result = item
					})
				}
				if (result) break
			}
			return result
		}
	}
}

export default createUndoRedo

