import { DesignerInteraction as Step3Interaction } from '../../lesson7-step3/src/interaction.js'
import { screenToWorld, zoomAt } from './viewport-math.js'

export class DesignerInteraction extends Step3Interaction {
  constructor(model, view) {
    super(model, view)
    this.panning = null
  }

  enable() {
    super.enable()
    this.view.root.addEventListener('wheel', (event) => this.wheel(event), { passive: false })
  }

  toScreen(event) {
    const bounds = this.view.root.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * Number(this.view.root.getAttribute('width')) / bounds.width,
      y: (event.clientY - bounds.top) * Number(this.view.root.getAttribute('height')) / bounds.height,
    }
  }

  getPoint(event) {
    return screenToWorld(this.toScreen(event), this.view.viewport)
  }

  wheel(event) {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
    this.view.viewport = zoomAt(this.toScreen(event), this.view.viewport, factor)
    this.view.applyViewport()
  }

  pointerDown(event) {
    if (this.tool === 'pan' || event.button === 1) {
      this.panning = { clientX: event.clientX, clientY: event.clientY }
      this.view.root.setPointerCapture(event.pointerId)
      return
    }
    super.pointerDown(event)
  }

  pointerMove(event) {
    if (this.panning) {
      const previous = this.toScreen(this.panning)
      const current = this.toScreen(event)
      this.view.viewport.x += current.x - previous.x
      this.view.viewport.y += current.y - previous.y
      this.panning = { clientX: event.clientX, clientY: event.clientY }
      this.view.applyViewport()
      return
    }
    super.pointerMove(event)
  }

  pointerUp(event) {
    if (this.panning) {
      this.panning = null
      this.view.root.releasePointerCapture(event.pointerId)
      return
    }
    super.pointerUp(event)
  }
}
