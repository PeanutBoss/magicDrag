export declare function throttle(fn: any, delay: number, options?: any): (...rest: any[]) => void;
export declare function getElement(ele: string | HTMLElement): HTMLElement;
export declare function mergeObject(target: any, source: any): any;
export declare function isNullOrUndefined(val: unknown): boolean;
export declare function conditionExecute(condition: any, task1: any, task2?: any): any;
export declare function removeElements(elements: HTMLElement[]): void;
export declare function baseErrorTips(condition: any, msg: any): void;
export declare function baseWarnTips(condition: any, msg: any): void;
type SetStyle = {
    (target: HTMLElement, styleData: {
        [key: string]: string;
    }): void;
    (target: HTMLElement, styleKey: string, styleValue: string | number): void;
};
export declare const setStyle: SetStyle;
export declare function transferControl(defaultAction: any, callback?: any, ...rest: any[]): void;
export declare function getObjectIntValue(object: any): any;
export declare function appendChild(parent: HTMLElement, ...child: HTMLElement[]): void;
export declare function addClassName(element: HTMLElement, className: string): void;
export declare function removeClassName(element: HTMLElement, className: string): void;
export declare function watcher(): {
    executeCB(newV: any, oldV: any): void;
    insertCB(callback: any): void;
    destroy(): void;
};
export declare function deepFlatObj(object: any): {};
export declare const createElement: {
    <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K];
    <K_1 extends keyof HTMLElementDeprecatedTagNameMap>(tagName: K_1, options?: ElementCreationOptions): HTMLElementDeprecatedTagNameMap[K_1];
    (tagName: string, options?: ElementCreationOptions): HTMLElement;
};
export declare function deepClone(obj: object, clones?: WeakMap<object, any>): any;
export declare function numberToStringSize(size: Record<string, number>): Record<string, string>;
export {};
