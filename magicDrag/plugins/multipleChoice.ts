import { Plugin } from '../functions'
import { useSpecialKey } from './shortcut'
const { ctrlIsPress } = useSpecialKey()

class MultipleChoice implements Plugin {
  private _checkedList
  private initialPosList
  public name: string
  constructor() {
    this.name = 'multipleChecked'
    this.init()
  }
  init() {
    this._checkedList = []
    this.initialPosList = []
  }
  unbind() {}
  targetPressChange(isPress, elementParameter) {
    if (!ctrlIsPress.value || !isPress) return
    console.log(isPress, elementParameter, 'isPress, elementParameter')
  }
  // 切换选中状态
  toggleCheck(element) {
    if (this.has(element)) this.remove(element)
    else this.append(element)
  }
  append(element) {
    this._checkedList.push(element)
  }
  remove(element) {
    this._checkedList.splice(this._getIndex(element), 1)
  }
  has(element) {
    return this._getIndex(element) > -1
  }

  // 保存移动前的位置信息
  saveInitialMovement(element) {
    this.initialPosList = this._checkedList
      .filter(item => item.tableId !== element.tableId)
      .map(m => ({ left: m.left, top: m.top, width: m.width, height: m.height }))
  }
  // 重置位置信息
  resetMovement() {
    this.initialPosList = []
  }
  // 移动其他的组件
  emitDrag(element, movement) {
    if (this._checkedList.length === 1 || !this.has(element)) return
    const excludeList = this._checkedList.filter(item => item.tableId !== element.tableId)

    excludeList.forEach((item, index) => {
      item.left = this.initialPosList[index].left + movement.x
      item.top = this.initialPosList[index].top + movement.y
    })
  }
  // 检查是否抵达边界
  isOnBoundary() {}

  _getIndex(element) {
    return this._checkedList.findIndex(checked => checked.tableId === element.tableId)
  }
  get checkedList() {
    return this._checkedList.slice()
  }
}

export default MultipleChoice
