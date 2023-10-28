import { Ref } from 'vue';
import { MagicDragOptions } from '../common/magicDragAssist';
export declare function splitState(state: State): {
    target: Ref<HTMLElement>;
    container: Ref<HTMLElement>;
    privateTarget: HTMLElement;
    privateContainer: HTMLElement;
    pointElements: any;
    allTarget: HTMLElement[];
    allContainer: HTMLElement[];
    pointState: any;
    targetState: any;
    initialTarget: any;
    containerInfo: any;
    downPointPosition: any;
    drag: boolean;
    resize: boolean;
    limitDragDirection: "X" | "Y";
    dragCallback: (dragAction: () => void, movement: {
        movementX: number;
        movementY: number;
    }) => void;
    resizeCallback: (resizeAction: () => void, direction: import("../common/magicDrag").Direction, movement: {
        movementX: number;
        movementY: number;
    }) => void;
    customPointClass: string;
    containerSelector: string;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    pointSize: number;
};
export interface ElementParameter {
    target: Ref<HTMLElement>;
    container: Ref<HTMLElement>;
    privateTarget: HTMLElement | null;
    privateContainer: HTMLElement | null;
    pointElements: any;
    allTarget: HTMLElement[];
    allContainer: HTMLElement[];
}
export interface StateParameter {
    pointState: any;
    targetState: any;
}
export interface GlobalDataParameter {
    initialTarget: any;
    containerInfo: any;
    downPointPosition: any;
}
export type State = {
    elementParameter: ElementParameter;
    stateParameter: StateParameter;
    globalDataParameter: GlobalDataParameter;
    optionParameter: MagicDragOptions;
};
type Callback = (element: HTMLElement, state: any) => void;
declare class StateManager {
    private elementStates;
    private selectedElement;
    private selectedState;
    private subscriptions;
    /**
     * 添加 DOM 元素的状态
     * @param element 添加的DOM元素
     * @param initialState DOM
     * @param isSetSelected 是否设置为选中状态
     */
    registerElementState(element: HTMLElement, initialState: any, isSetSelected?: boolean): void;
    getElementState(element: HTMLElement): State;
    updateElementState(element: HTMLElement, newState: any): void;
    get targetState(): any;
    get currentElement(): HTMLElement;
    get currentState(): any;
    get size(): number;
    get notLockState(): {
        target: HTMLElement;
        zIndex: any;
    }[];
    setCurrentElement(element: HTMLElement | null): void;
    updatePublicTargetState(): void;
    updatePublicPointState(): void;
    subscribe(key: string, callback: Callback): void;
    unsubscribe(key: string, callback: Callback): void;
    private notifySubscribers;
    get containerLeft(): any;
    get containerTop(): any;
    static COORDINATE_KEY: string[];
}
export default StateManager;
