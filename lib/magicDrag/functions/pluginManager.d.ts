export default class PluginManager {
    private _plugins;
    get plugins(): Map<string, Plugin>;
    registerPlugin(name: string, plugin: Plugin): void;
    installPlugin(): void;
    uninstallPlugin(name: string): void;
    callExtensionPoint(extensionPoint: string, ...args: any[]): void;
}
export interface Plugin {
    name: string;
    init: () => void;
    unbind: () => void;
    drag?: (...args: any[]) => void;
    resize?: (...args: any[]) => void;
    targetPressChange?: (...args: any[]) => void;
    pointPressChange?: (...args: any[]) => void;
}
