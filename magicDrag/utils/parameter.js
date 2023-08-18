import { isNullOrUndefined } from "./tools.ts";
var currentTarget = null;
var wholeParameter = {};
export function getParameter(index) {
    return wholeParameter[index];
}
export function setParameter(index, value) {
    wholeParameter[index] = value;
}
export function setCurrentTarget(target) {
    currentTarget = target;
}
export function getCurrentTarget() {
    return currentTarget;
}
export function getCurrentParameter() {
    var target = getCurrentTarget();
    return getParameter(target.dataset.index);
}
export function getNotLockParameter(excludeIndex) {
    var notLockParameterList = [];
    for (var _i = 0, _a = Object.entries(wholeParameter); _i < _a.length; _i++) {
        var _b = _a[_i], index = _b[0], parameter = _b[1];
        if (!isNullOrUndefined(excludeIndex) && excludeIndex == index)
            continue;
        if (!parameter.globalDataParameter.initialTarget.isLock) {
            notLockParameterList.push(parameter);
        }
    }
    return notLockParameterList.map(function (m) { return ({ target: m.elementParameter.privateTarget, zIndex: m.globalDataParameter.initialTarget.zIndex }); });
}
