import { Interaction as Step2Interaction } from '../../lesson6-step2/src/interaction.js'
import { getSelectionBounds, moveSnapshot, pointInBounds } from './multi-drag.js'

export class Interaction extends Step2Interaction {
  constructor(graph, options = {}) {
    super(graph, options)
    this.multiDragging = null
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const nodes = [...this.selectedNodeIds].map((id) => this.graph.model.getNode(id)).filter(Boolean)
    const node = this.graph.getNodeAt(point.x, point.y)
    const canStartMultiDrag = (
      nodes.length > 1
      && !event.shiftKey && !event.ctrlKey && !event.metaKey
      && !this.graph.getPortAt(point.x, point.y)
      && !this.handles.hit(point.x, point.y)
      && !this.vertexHandles.hit(point.x, point.y)
      && ((node && this.selectedNodeIds.has(node.id)) || (!node && pointInBounds(point, getSelectionBounds(nodes))))
    )
    if (!canStartMultiDrag) {
      super.pointerDown(event)
      return
    }

    const snapshot = nodes.map((item) => ({ id: item.id, x: item.x, y: item.y }))
    this.multiDragging = { start: point, snapshot, dx: 0, dy: 0 }
    this.graph.view.startMultiPreview(this.selectedNodeIds)
    this.root.setPointerCapture(event.pointerId)
  }

  pointerMove(event) {
    if (!this.multiDragging) {
      super.pointerMove(event)
      return
    }
    const point = this.getPoint(event)
    this.multiDragging.dx = point.x - this.multiDragging.start.x
    this.multiDragging.dy = point.y - this.multiDragging.start.y
    this.graph.view.moveMultiPreview(this.multiDragging.dx, this.multiDragging.dy)
    this.selectionOutline.rect.setAttribute(
      'transform',
      `translate(${this.multiDragging.dx},${this.multiDragging.dy})`,
    )
  }

  pointerUp(event) {
    if (!this.multiDragging) {
      super.pointerUp(event)
      return
    }
    const drag = this.multiDragging
    this.multiDragging = null
    this.graph.view.finishMultiPreview(this.selectedNodeIds)
    this.selectionOutline.rect.removeAttribute('transform')
    this.root.releasePointerCapture(event.pointerId)
    for (const position of moveSnapshot(drag.snapshot, drag.dx, drag.dy)) {
      this.graph.moveNode(position.id, position.x, position.y)
    }
    this.selectionOutline.show(this.selectedNodeIds)
  }
}
