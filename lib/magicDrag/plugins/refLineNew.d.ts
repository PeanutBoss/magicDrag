import { Plugin } from '../functions/pluginManager';
import { State } from '../functions/stateManager';
declare global {
    interface HTMLElement {
        show: () => void;
        hide: () => void;
        isShow: () => boolean;
    }
}
export declare class RefLineNew implements Plugin {
    private readonly options;
    name: string;
    private lines;
    private isHasAdsorbElementX;
    private isHasAdsorbElementY;
    constructor(options?: {
        gap?: number;
        adsorbAfterStopDiff?: boolean;
    });
    init(): void;
    unbind(): void;
    drag({ elementParameter, stateParameter, globalDataParameter, optionParameter }: State, { movement, _updateContourPointPosition, _updateState }: {
        movement: any;
        _updateContourPointPosition: any;
        _updateState: any;
    }): void;
    resize({ elementParameter }: State, { movementX, movementY, _updateTargetStyle, _updatePointPosition }: {
        movementX: any;
        movementY: any;
        _updateTargetStyle: any;
        _updatePointPosition: any;
    }): void;
    targetPressChange(isPress: boolean, elementParameter: any): void;
    pointPressChange(isPress: boolean, elementParameter: any): void;
    checkAdsorb({ elementParameter }: {
        elementParameter: any;
    }, adsorbCallback?: any): void;
    hideRefLine(): void;
    _isNearly(dragValue: any, targetValue: any, isStrict?: boolean): boolean;
}
