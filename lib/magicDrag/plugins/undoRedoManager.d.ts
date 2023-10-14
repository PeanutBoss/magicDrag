declare class UndoRedoManager {
    private history;
    private redoStack;
    addAction(action: any): void;
    undo(): void;
    redo(): void;
}
declare class MoveAction {
    private element;
    private deltaX;
    private deltaY;
    constructor(element: HTMLElement, deltaX: number, deltaY: number);
    undo(): void;
    redo(): void;
}
declare const undoRedoManager: UndoRedoManager;
declare function handleDrag(element: HTMLElement, deltaX: number, deltaY: number): void;
declare function handleUndo(): void;
declare function handleRedo(): void;
