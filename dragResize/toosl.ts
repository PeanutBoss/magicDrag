/**
 * 角度转弧度
 * @param angle
 */
export function getRadians (angle: number) {
  return angle * Math.PI / 180
}

/**
 * 弧度转角度
 * @param radian
 */
export function getAngle (radian: number) {
  return radian / Math.PI * 180
}

/**
 * @description 获取对边长度，默认以弧度为单位
 * @param number 度数
 * @param hypotenuse 斜边长度
 * @param isRadians 是否弧度，默认为false
 */
export function getOppositeSide (number: number, hypotenuse: number, isRadians = false) {
  return isRadians ? Math.sin(number) * hypotenuse : Math.sin(getRadians(number)) * hypotenuse
}

/**
 * @description 获取邻边长度，默认以弧度为单位
 * @param number 度数
 * @param hypotenuse 斜边长度
 * @param isRadians 是否弧度，默认为false
 */
export function getAdjacentSide (number: number, hypotenuse: number, isRadians = false) {
  return isRadians ? Math.cos(number) * hypotenuse : Math.cos(getRadians(number)) * hypotenuse
}

/**
 * @description 获取斜边长度，默认以弧度为单位
 * @param oppositeSide 对边长度
 * @param adjacentSide 邻边长度
 */
export function getHypotenuseSide (oppositeSide: number, adjacentSide: number) {
  return Math.sqrt(oppositeSide ** 2 + adjacentSide ** 2)
}
