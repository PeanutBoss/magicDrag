/**
 * @description 移动元素
 * @param selector 要移动的元素或选择器
 * @param moveCallback 移动时的回调
 * @param moveOption 限制移动的配置项
 */
interface MoveOption {
    limitDirection?: 'X' | 'Y' | null;
    throttleTime?: number;
    offsetLeft?: number;
    offsetTop?: number;
}
export declare function useMoveElement(selector: string | HTMLElement, moveCallback?: any, moveOption?: MoveOption): {
    mouseX: import("@vue/reactivity").ComputedRef<number>;
    mouseY: import("@vue/reactivity").ComputedRef<number>;
    left: import("@vue/reactivity").Ref<number>;
    top: import("@vue/reactivity").Ref<number>;
    movementX: import("@vue/reactivity").Ref<any>;
    movementY: import("@vue/reactivity").Ref<any>;
    isPress: Readonly<import("@vue/reactivity").Ref<boolean>>;
    destroy: () => void;
};
export {};
