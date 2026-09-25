import { Interaction as Step1Interaction } from '../../lesson6-step1/src/interaction.js'
import { rectFromPoints } from '../../lesson6-step1/src/selection-frame.js'
import { combineSelection, SelectionOutline } from './selection-outline.js'

export class Interaction extends Step1Interaction {
  constructor(graph, options = {}) {
    super(graph, options)
    this.selectionOutline = new SelectionOutline(graph)
  }

  enable() {
    this.graph.model.on('node:moved', () => this.selectionOutline.show(this.selectedNodeIds))
    return super.enable()
  }

  startSelecting(point, append, pointerId) {
    const previous = new Set(this.selectedNodeIds)
    if (!append) {
      this.selectedNodeIds.clear()
      this.graph.view.selectNodes([])
      this.selectionOutline.show([])
    }
    this.selectedNodeId = null
    this.selectedEdgeId = null
    this.graph.view.selectEdge(null)
    this.handles.show(null)
    this.vertexHandles.show(null)
    this.selecting = { start: point, append, previous }
    this.selectionFrame.show(rectFromPoints(point, point))
    this.root.setPointerCapture(pointerId)
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const append = event.shiftKey || event.ctrlKey || event.metaKey
    const occupied = (
      this.vertexHandles.hit(point.x, point.y)
      || this.handles.hit(point.x, point.y)
      || this.graph.getPortAt(point.x, point.y)
      || this.graph.getNodeAt(point.x, point.y)
      || this.graph.getEdgeAt(point.x, point.y)
    )
    if (append || !occupied) {
      this.startSelecting(point, append, event.pointerId)
      return
    }
    super.pointerDown(event)
    this.selectedNodeIds = new Set(this.graph.view.selectedNodeIds)
    this.selectionOutline.show(this.selectedNodeIds)
  }

  pointerUp(event) {
    if (!this.selecting) {
      super.pointerUp(event)
      this.selectedNodeIds = new Set(this.graph.view.selectedNodeIds)
      this.selectionOutline.show(this.selectedNodeIds)
      return
    }
    const selecting = this.selecting
    const point = this.getPoint(event)
    const rect = rectFromPoints(selecting.start, point)
    const incoming = this.graph.model.getNodesInRect(rect).map((node) => node.id)
    this.selectedNodeIds = combineSelection(selecting.previous, incoming, selecting.append)
    this.selectedNodeId = this.selectedNodeIds.size === 1 ? [...this.selectedNodeIds][0] : null
    this.selecting = null
    this.selectionFrame.hide()
    this.root.releasePointerCapture(event.pointerId)
    this.graph.view.selectNodes(this.selectedNodeIds)
    this.selectionOutline.show(this.selectedNodeIds)
  }

  keyDown(event) {
    super.keyDown(event)
    this.selectedNodeIds = new Set([...this.selectedNodeIds].filter((id) => this.graph.model.getNode(id)))
    this.graph.view.selectNodes(this.selectedNodeIds)
    this.selectionOutline.show(this.selectedNodeIds)
  }
}
