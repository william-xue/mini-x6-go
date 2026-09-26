import { AssemblyInteraction as BaseInteraction } from '../../lesson8-step4/src/interaction.js'

export class AssemblyInteraction extends BaseInteraction {
  constructor(model, view, history) {
    super(model, view)
    this.history = history
    this.dragOrigin = null
  }

  enable() {
    super.enable()
    window.addEventListener('keydown', (event) => {
      const modifier = event.metaKey || event.ctrlKey
      if (!modifier || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) this.history.redo()
      else this.history.undo()
    })
  }

  pointerDown(event) {
    super.pointerDown(event)
    if (!this.dragging) return
    const instance = this.model.instances.get(this.dragging.id)
    this.dragOrigin = instance ? { x: instance.x, y: instance.y } : null
  }

  pointerUp(event) {
    const dragging = this.dragging
    const origin = this.dragOrigin
    this.dragOrigin = null
    super.pointerUp(event)

    if (!dragging || !origin) return
    const instance = this.model.instances.get(dragging.id)
    if (!instance) return
    const target = { x: instance.x, y: instance.y }
    if (target.x === origin.x && target.y === origin.y) return

    // 一次拖动只记一条命令，拖动过程中的几十次 moveInstance 不进历史。
    // 命令是纯数据，不含任何函数。
    this.history.push({
      type: 'instance:move',
      label: `移动 ${dragging.id}`,
      id: dragging.id,
      from: origin,
      to: target,
    })
  }
}
