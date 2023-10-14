import { State } from '../functions/stateManager';
export interface Plugin {
    name: string;
    init(parameter: State): void;
    drag?(parameter: State, cb?: any): void;
    resize?(parameter: State, cb?: any): void;
    unbind(parameter: State): void;
}
export declare function executePluginInit(plugins: Plugin[], elementParameter: any, stateParameter: any, globalDataParameter: any, options: any): void;
export declare function executePluginDrag(plugins: Plugin[], parameter: any, cb?: any): void;
export declare function executePluginResize(plugins: Plugin[], parameter: any, cb?: any): void;
export declare function executePluginUnbind(plugins: Plugin[], elementParameter: any, stateParameter: any, globalDataParameter: any, options: any): void;
export declare function duplicateRemovalPlugin(plugins: Plugin[]): Plugin[];
