export class History {
  constructor({ model, apply, revert, limit = 200, onChange = null } = {}) {
    this.model = model
    this.apply = apply
    this.revert = revert
    this.limit = limit
    this.onChange = onChange
    this.undoStack = []
    this.redoStack = []
  }

  get size() {
    return this.undoStack.length
  }

  get redoSize() {
    return this.redoStack.length
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  // 记一条已经发生的操作
  push(command) {
    this.undoStack.push(command)
    if (this.undoStack.length > this.limit) this.undoStack.shift()
    this.redoStack.length = 0
    this.notify()
    return command
  }

  // 记一条还没执行的操作：先执行，再入栈
  run(command) {
    this.apply(this.model, command)
    return this.push(command)
  }

  undo() {
    const command = this.undoStack.pop()
    if (!command) return null
    this.revert(this.model, command)
    this.redoStack.push(command)
    this.notify()
    return command
  }

  redo() {
    const command = this.redoStack.pop()
    if (!command) return null
    this.apply(this.model, command)
    this.undoStack.push(command)
    this.notify()
    return command
  }

  clear() {
    this.undoStack.length = 0
    this.redoStack.length = 0
    this.notify()
  }

  notify() {
    if (this.onChange) this.onChange(this)
  }
}
