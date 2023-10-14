import { Plugin } from '../index';
export declare const menuState: any;
export type ActionKey = 'lock' | 'blowUp' | 'reduce' | 'copy' | 'delete' | 'rotate';
export type DefaultContextMenuOptions = {
    offsetX?: number;
    offsetY?: number;
    lockTargetClassName?: string;
    containerClassName?: string;
    itemClassName?: string;
    lockItemClassName?: string;
};
export default class ContextMenu implements Plugin {
    private actionList;
    private options;
    private stateManager;
    name: any;
    private actions;
    constructor(actionList: any, options: any, stateManager: any);
    init(): void;
    unbind({ elementParameter }: {
        elementParameter: any;
    }): void;
    getActionMapByKey(keyList: any): {};
    contextCallback(event: any): void;
    getMenuBox(): any;
    showMenu(isShow: any, position?: any): void;
    hiddenMenu(): void;
    destroyMenu(): void;
    bindHidden: null;
    bindContextCallback: null;
}
