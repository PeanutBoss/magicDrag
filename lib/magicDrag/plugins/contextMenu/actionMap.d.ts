export interface ActionDescribe {
    name: string;
    actionDom: HTMLElement | null;
    actionName: string;
    customData?: Record<any, any>;
    actionCallback(event: any): void;
    getMenuContextParameter?(...rest: any[]): any;
    dragCallbacks?: {
        beforeCallback?(targetState: any): boolean;
        afterCallback?(targetState: any): void;
    };
    resizeCallbacks?: {
        beforeCallback?(targetState: any): boolean;
        afterCallback?(targetState: any): void;
    };
    mousedownCallbacks?: {
        beforeCallback?(targetState: any): boolean;
        afterCallback?(targetState: any, state: any): void;
    };
    [key: string]: any;
}
export interface ActionMap {
    [key: string]: ActionDescribe;
}
export declare const actionMap: ActionMap;
export declare function getActionCallbacks(type: 'dragCallbacks' | 'resizeCallbacks' | 'mousedownCallbacks'): any[];
export declare function executeActionCallbacks(actionData: any, stateManager: any, type: 'beforeCallback' | 'afterCallback'): boolean;
export declare function updatePostRotateOutlinePoint({ initialTarget, downPointPosition }: {
    initialTarget: any;
    downPointPosition: any;
}, { pointElements }: {
    pointElements: any;
}, { rotate, updateStyle }: {
    rotate: any;
    updateStyle?: boolean;
}): {};
