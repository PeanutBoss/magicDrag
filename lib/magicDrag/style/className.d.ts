export declare const MAGIC_DRAG = "magic_drag";
export declare const ClassName: {
    OutlinePoint: string;
    ContainerClassName: string;
    ItemClassName: string;
    LockItemClassName: string;
    LockTargetClassName: string;
};
export declare enum TargetStatus {
    Normal = 55555,
    Checked = 77777,
    Locked = 44444,
    Uppermost = 66666,
    Lowest = 33333
}
export declare function getTargetZIndex(targetStatus: TargetStatus, target: HTMLElement): number;
