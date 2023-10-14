import { State, PluginManager } from './index';
export default class Draggable {
    private plugins;
    private stateManager;
    constructor(plugins: PluginManager, parameter: State, stateManager: any);
    start(currentState: any): void;
    dragStart(): void;
    moveTargetCallback(dragCallback: any, { downPointPosition, pointElements, targetState, containerInfo }: {
        downPointPosition: any;
        pointElements: any;
        targetState: any;
        containerInfo: any;
    }): (moveAction: any, movement: any) => void;
    limitTargetMove(initialTarget: any, containerInfo: any, movement: any): void;
    targetMouseDown({ downPointPosition, pointElements }: {
        downPointPosition: any;
        pointElements: any;
    }): void;
    targetMouseUp({ initialTarget, movementX, movementY }: {
        initialTarget: any;
        movementX: any;
        movementY: any;
    }): void;
    isPressChangeCallback(elementParameter: any, { targetState }: {
        targetState: any;
    }, { downPointPosition, initialTarget }: {
        downPointPosition: any;
        initialTarget: any;
    }, { movementX, movementY }: {
        movementX: any;
        movementY: any;
    }): (newV: any) => void;
}
