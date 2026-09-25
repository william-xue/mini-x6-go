import { Interaction as Step5Interaction } from '../../lesson5-step3/src/interaction.js'
import { SelectionFrame, rectFromPoints } from './selection-frame.js'

export class Interaction extends Step5Interaction {
  constructor(graph, options = {}) {
    super(graph, options)
    this.selectionFrame = new SelectionFrame(this.root)
    this.selecting = null
    this.selectedNodeIds = new Set()
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const occupied = (
      this.vertexHandles.hit(point.x, point.y)
      || this.handles.hit(point.x, point.y)
      || this.graph.getPortAt(point.x, point.y)
      || this.graph.getNodeAt(point.x, point.y)
      || this.graph.getEdgeAt(point.x, point.y)
    )
    if (occupied) {
      super.pointerDown(event)
      return
    }

    this.selectedNodeId = null
    this.selectedEdgeId = null
    this.selectedNodeIds.clear()
    this.graph.view.selectNodes([])
    this.graph.view.selectEdge(null)
    this.handles.show(null)
    this.vertexHandles.show(null)
    this.selecting = { start: point }
    this.selectionFrame.show(rectFromPoints(point, point))
    this.root.setPointerCapture(event.pointerId)
  }

  pointerMove(event) {
    if (!this.selecting) {
      super.pointerMove(event)
      return
    }
    const point = this.getPoint(event)
    this.selectionFrame.show(rectFromPoints(this.selecting.start, point))
  }

  pointerUp(event) {
    if (!this.selecting) {
      super.pointerUp(event)
      return
    }
    const point = this.getPoint(event)
    const rect = rectFromPoints(this.selecting.start, point)
    const nodes = this.graph.model.getNodesInRect(rect)
    this.selecting = null
    this.selectionFrame.hide()
    this.root.releasePointerCapture(event.pointerId)
    this.selectedNodeIds = new Set(nodes.map((node) => node.id))
    this.selectedNodeId = nodes.length === 1 ? nodes[0].id : null
    this.graph.view.selectNodes(this.selectedNodeIds)
  }
}
