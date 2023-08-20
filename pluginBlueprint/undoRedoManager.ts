class UndoRedoManager {
  private history: any[] = [];
  private redoStack: any[] = [];

  addAction(action: any) {
    this.history.push(action);
    this.redoStack = [];
  }

  undo() {
    if (this.history.length > 0) {
      const action = this.history.pop();
      this.redoStack.push(action);
      // Apply the inverse of the action to undo it
      action.undo();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const action = this.redoStack.pop();
      this.history.push(action);
      // Apply the action again to redo it
      action.redo();
    }
  }
}

// 示例使用
class MoveAction {
  constructor(private element: HTMLElement, private deltaX: number, private deltaY: number) {}

  undo() {
    this.element.style.transform = `translate(${0}px, ${0}px)`;
  }

  redo() {
    this.element.style.transform = `translate(${this.deltaX}px, ${this.deltaY}px)`;
  }
}

const undoRedoManager = new UndoRedoManager();

// 用户拖拽操作时，添加到历史记录
function handleDrag(element: HTMLElement, deltaX: number, deltaY: number) {
  const moveAction = new MoveAction(element, deltaX, deltaY);
  undoRedoManager.addAction(moveAction);
}

// 用户点击取消操作按钮时
function handleUndo() {
  undoRedoManager.undo();
}

// 用户点击重做操作按钮时
function handleRedo() {
  undoRedoManager.redo();
}
