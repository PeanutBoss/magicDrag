export declare namespace PluginBlueprint {
    class PluginManager {
        private plugins;
        registerPlugin(name: string, plugin: Plugin): void;
        installPlugin(name: string): void;
        uninstallPlugin(name: string): void;
        callExtensionPoint(extensionPoint: string, ...args: any[]): void;
    }
    interface Plugin {
        name: string;
        init: () => void;
        unbind: () => void;
        drag?: (...args: any[]) => void;
        resize?: (...args: any[]) => void;
        targetPressChange?: (...args: any[]) => void;
        pointPressChange?: (...args: any[]) => void;
    }
}
