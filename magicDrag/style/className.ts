export const MAGIC_DRAG = 'magic_drag'

function addPrefix (className) {
  return ` ${MAGIC_DRAG}-${className}`
}

export const ClassName = {
  OutlinePoint: addPrefix('outline_point'), // 轮廓点的类名
  // MenuBox : addPrefix('menu_box'), // menuBox类名
  ContainerClassName: addPrefix('menu_container'), // 菜单的类名
  ItemClassName: addPrefix('menu_item'), // 菜单选项的类名
  LockItemClassName: addPrefix('menu_item-lock'), // 锁定的菜单选项的类名
  LockTargetClassName: addPrefix('target-lock'), // 锁定的目标元素的类名
}

export enum TargetStatus {
  Normal = 66666,
  Checked = 77777,
  Locked = 55555
}
type StatusType = TargetStatus.Normal| TargetStatus.Checked | TargetStatus.Locked

// const zIndexRecord: Record<StatusType, number> = {
//   [TargetStatus.Normal]: 0,
//   [TargetStatus.Checked]: 0,
//   [TargetStatus.Locked]: 0
// }

export function getTargetZIndex (targetStatus: TargetStatus, target: HTMLElement) {
  return targetStatus - Number(target.dataset.index)
}
