import { Plugin } from '../functions/pluginManager';
declare class Keymap implements Plugin {
    name: string;
    static CTRL: string;
    static SHIFT: string;
    static ALT: string;
    private enableMap;
    private shortcuts;
    constructor();
    init(): void;
    unbind(): void;
    registerShortcut(shortcut: string, action: (...args: any[]) => void, options?: {
        priority?: any;
    }): void;
    functionOrder(shortcut: any): string;
    triggerShortcut(event: KeyboardEvent): void;
    getDescribeFromEvent(event: KeyboardEvent): string;
    configureShortcuts(shortcuts: any): void;
    enableShortcut(shortcut: any): void;
    disableShortcut(shortcut: any): void;
    bindTriggerShortcut: any;
}
export default Keymap;
