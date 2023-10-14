import { State, PluginManager } from './index';
import { InitPointOption, PointPosition } from '../common/magicDrag';
export default class Resizeable {
    private plugins;
    private stateManager;
    constructor(plugins: PluginManager, parameter: State, stateManager: any);
    init({ elementParameter, stateParameter, globalDataParameter, optionParameter }: {
        elementParameter: any;
        stateParameter: any;
        globalDataParameter: any;
        optionParameter: any;
    }): void;
    setPointStyle(): void;
    createParentPosition({ left, top, width, height }: {
        left: any;
        top: any;
        width: any;
        height: any;
    }, pointSize: number): PointPosition;
    initContourPoints(elementParameter: any, stateParameter: any, globalDataParameter: any, options: any, runtimeParameter: any): void;
    pointIsPressChangeCallback(target: any, { initialTarget, pointState, direction }: {
        initialTarget: any;
        pointState: any;
        direction: any;
    }, elementParameter: any): (newV: any) => void;
    initPointStyle(point: HTMLElement, { pointPosition, direction, pointSize }: InitPointOption, pointDefaultStyle?: any): void;
    addDragFunctionToPoint(elementParameter: any, stateParameter: any, globalDataParameter: any, options: any, runTimeParameter: any): Readonly<import("@vue/reactivity").Ref<boolean>>;
    movePointCallback(stateParameter: any, elementParameter: any, globalParameter: any, options: any, runTimeParameter: any): void;
    createContourPoint(pointElements: any, { direction }: {
        direction: any;
    }): any;
}
