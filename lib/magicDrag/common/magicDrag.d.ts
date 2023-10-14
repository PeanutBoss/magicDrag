export type Direction = 'lt' | 'lb' | 'rt' | 'rb' | 'l' | 'r' | 't' | 'b';
interface DirectionDescription {
    hasL: boolean;
    hasR: boolean;
    hasT: boolean;
    hasB: boolean;
}
export declare const All_DIRECTION: Direction[];
export declare function getDirectionDescription(direction: Direction): DirectionDescription;
export declare function createCoordinateStrategies(): {};
export declare function createResizeLimitStrategies({ minWidth, minHeight, maxWidth, maxHeight }: {
    minWidth: any;
    minHeight: any;
    maxWidth: any;
    maxHeight: any;
}, { initialTarget, containerInfo }: {
    initialTarget: any;
    containerInfo: any;
}): {};
export declare function createParamStrategies(): {};
export type PointPosition = {
    [key in Direction]: [number, number, string?, ('X' | 'Y')?];
};
export declare function setPosition(point: HTMLElement, pointPosition: PointPosition, direction: Direction): void;
export declare function createParentPosition({ left, top, width, height }: {
    left: any;
    top: any;
    width: any;
    height: any;
}, pointSize: number): PointPosition;
export interface InitPointOption {
    pointPosition: PointPosition;
    direction: Direction;
    pointSize: number;
}
export declare function updateState(state: any, keyOrState: object | string, value?: any): void;
export declare function showOrHideContourPoint(pointElements: any, isShow: any): void;
export declare function blurOrFocus(pointElements: any, targetState: any, stateManager: any): (target: HTMLElement, isBind?: boolean) => void;
export declare function updateContourPointPosition(downPointPosition: any, movement: any, pointElements: any): void;
export declare function updateTargetStyle(target: any, { direction, movementX, movementY }: {
    direction: any;
    movementX: any;
    movementY: any;
}, { targetState, initialTarget }: {
    targetState: any;
    initialTarget: any;
}): any;
/**
 * @description drag an outline point to resize it, update coordinate information of outline points synchronously
 * @desc 拖拽某个轮廓点调整大小时，同步更新轮廓点的坐标信息
 * @param target 参考元素
 * @param direction 调整大小时按下的轮廓点
 * @param movementX 按下的轮廓点水平方向移动的距离
 * @param movementY 按下的轮廓点竖直方向移动的距离
 * @param initialTarget 参考元素在调整大小前的尺寸和坐标信息
 * @param pointElements 所有的轮廓点
 * @param pointSize 轮廓点的大小
 * @param pointState 轮廓点的状态
 * @param updateOption { excludeCurPoint: boolean, updateDirection: boolean } 更新的配置项
 * excludeCurPoint: 是否排除当前轮廓点（例如按下左下角轮廓点调整大小时，其他轮廓点的坐标是根据这个轮廓点的移动信息更新的，因此不需要更新这个轮廓点的坐标）
 * updateDirection: 按下某个轮廓点时，pointState对应的状态也会更新，updateDirection控制其是否更新
 */
export declare function updatePointPosition(target: any, { direction, movementX, movementY }: {
    direction: any;
    movementX: any;
    movementY: any;
}, { initialTarget, pointElements, pointSize, pointState }: {
    initialTarget: any;
    pointElements: any;
    pointSize: any;
    pointState: any;
}, updateOption?: any): PointPosition;
export declare function limitTargetResize(target: any, { direction, movementX, movementY }: {
    direction: any;
    movementX: any;
    movementY: any;
}, { initialTarget, containerInfo, minWidth, minHeight, maxWidth, maxHeight }: {
    initialTarget: any;
    containerInfo: any;
    minWidth: any;
    minHeight: any;
    maxWidth: any;
    maxHeight: any;
}): void;
export declare function getCoordinateByElement(element: HTMLElement): {
    width: number;
    height: number;
    left: number;
    top: number;
};
export declare function updateInitialTarget(targetCoordinate?: any, newCoordinate?: any): {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare function saveDownPointPosition({ downPointPosition, pointElements }: {
    downPointPosition: any;
    pointElements: any;
}): void;
export declare function initTargetStyle(target: any, size: any, position: any): void;
export declare function saveInitialData(target: any, initialTarget: any, isTest: any): void;
export declare function todoUnMount(cb: any): void;
export {};
