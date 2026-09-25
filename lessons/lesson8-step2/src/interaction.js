export class AssemblyInteraction {
  constructor(model, view) {
    this.model = model
    this.view = view
    this.dragging = null
  }

  enable() {
    this.view.root.addEventListener('pointerdown', (event) => this.pointerDown(event))
    this.view.root.addEventListener('pointermove', (event) => this.pointerMove(event))
    this.view.root.addEventListener('pointerup', (event) => this.pointerUp(event))
  }

  getPoint(event) {
    const bounds = this.view.root.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * Number(this.view.root.getAttribute('width')) / bounds.width,
      y: (event.clientY - bounds.top) * Number(this.view.root.getAttribute('height')) / bounds.height,
    }
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const instance = this.model.getInstanceAt(point.x, point.y)
    this.view.selectInstance(instance?.id || null)
    if (!instance) return
    this.dragging = {
      id: instance.id,
      offsetX: point.x - instance.x,
      offsetY: point.y - instance.y,
    }
    this.view.root.setPointerCapture(event.pointerId)
  }

  pointerMove(event) {
    if (!this.dragging) return
    const point = this.getPoint(event)
    this.model.moveInstance(
      this.dragging.id,
      point.x - this.dragging.offsetX,
      point.y - this.dragging.offsetY,
    )
  }

  pointerUp(event) {
    if (!this.dragging) return
    this.dragging = null
    this.view.root.releasePointerCapture(event.pointerId)
  }
}
