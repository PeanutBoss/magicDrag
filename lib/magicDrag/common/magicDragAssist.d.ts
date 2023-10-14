import { Direction } from './magicDrag.ts';
import { Ref } from '@vue/reactivity';
export interface MagicDragOptions {
    containerSelector: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    pointSize?: number;
    initialInfo?: {
        width?: number;
        height?: number;
        left?: number;
        top?: number;
    };
    containerRange?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        bottom?: number;
        right?: number;
    };
    skill?: {
        resize?: boolean;
        drag?: boolean;
        refLine?: boolean;
        keymap?: boolean;
        limitDragDirection?: 'X' | 'Y' | null;
    };
    callbacks?: {
        dragCallback?: (dragAction: () => void, movement: {
            movementX: number;
            movementY: number;
        }) => void;
        resizeCallback?: (resizeAction: () => void, direction: Direction, movement: {
            movementX: number;
            movementY: number;
        }) => void;
    };
    customClass?: {
        customPointClass?: string;
    };
}
export declare function defaultOptions(): MagicDragOptions;
export declare function allElement(): {
    allTarget: any[];
    allContainer: any[];
};
export declare function defaultState(): {
    targetState: {
        left: number;
        top: number;
        height: number;
        width: number;
        isPress: boolean;
        isLock: boolean;
    };
    pointState: {
        left: number;
        top: number;
        direction: any;
        isPress: boolean;
        movementX: number;
        movementY: number;
    };
};
export declare function storingDataContainer(): {
    $target: any;
    $container: any;
    initialTarget: any;
    pointElements: any;
    containerInfo: any;
    downPointPosition: any;
};
export interface MagicDragState {
    targetLeft: Ref<number>;
    targetTop: Ref<number>;
    targetWidth: Ref<number>;
    targetHeight: Ref<number>;
    targetIsLock: Ref<boolean>;
    pointLeft: Ref<number>;
    pointTop: Ref<number>;
    pointMovementX: Ref<number>;
    pointMovementY: Ref<number>;
    targetIsPress: Ref<boolean>;
    pointIsPress: Ref<boolean>;
    direction: Ref<string | null>;
}
