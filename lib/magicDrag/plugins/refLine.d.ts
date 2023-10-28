import { Plugin, State } from '../functions';
declare global {
    interface HTMLElement {
        show: (coordinate: any) => void;
        hide: () => void;
        isShow: () => boolean;
    }
    interface DOMRect {
        el?: HTMLElement;
        halfWidth?: number;
        halfHeight?: number;
    }
    type DragDOMRect = Partial<DOMRect>;
}
interface RefLineOptions {
    gap?: number;
    showRefLine?: boolean;
    adsorb?: boolean;
    showDistance?: boolean;
    showShadow?: boolean;
}
export default class RefLine implements Plugin {
    private readonly options;
    name: string;
    private lines;
    private tipEls;
    private isHasAdsorbElementY;
    private isHasAdsorbElementX;
    private isCenterX;
    private isCenterY;
    private rectManager;
    constructor(options?: RefLineOptions);
    init(): void;
    createLines(): void;
    createTipEl(): void;
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
    startCheck({ elementParameter }: {
        elementParameter: any;
    }, way: any, adsorbCallback?: any): void;
    calculateDistance(): void;
    executeShowDistanceTip(): void;
    buildConditions(item: any): void;
    executeCheckByConditions({ conditions, way, dragRect, anotherRect }: {
        conditions: any;
        way: any;
        dragRect: any;
        anotherRect: any;
    }): void;
    executeShowRefLine(): void;
    executeAdsorb({ way, adsorbCallback }: {
        way: any;
        adsorbCallback: any;
    }): void;
    checkEnd(): void;
    hideRefLine(): void;
    hideTip(): void;
}
export {};
