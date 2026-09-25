import { Interaction as Step1Interaction } from '../../lesson5-step1/src/interaction.js'
import { EdgeHandles } from './edge-handles.js'

export class Interaction extends Step1Interaction {
  constructor(graph, options = {}) {
    super(graph, options)
    this.handles = new EdgeHandles(graph)
    this.reconnecting = null
  }

  enable() {
    this.graph.model.on('edge:changed', (edge) => {
      if (edge.id === this.selectedEdgeId) this.handles.show(edge.id)
    })
    this.graph.model.on('edge:removed', (edge) => {
      if (edge.id === this.handles.edgeId) this.handles.show(null)
    })
    return super.enable()
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const handle = this.handles.hit(point.x, point.y)
    if (handle) {
      const fixedTerminal = handle.terminal === 'source' ? 'target' : 'source'
      const fixed = this.graph.model.getTerminalPoint(handle.edge[fixedTerminal])
      this.reconnecting = {
        edgeId: handle.edge.id,
        terminal: handle.terminal,
        fixed,
      }
      this.graph.view.showTempLine(fixed, point)
      this.root.setPointerCapture(event.pointerId)
      return
    }
    super.pointerDown(event)
    this.handles.show(this.selectedEdgeId)
  }

  pointerMove(event) {
    if (!this.reconnecting) {
      super.pointerMove(event)
      return
    }
    const point = this.getPoint(event)
    this.graph.view.showTempLine(this.reconnecting.fixed, point)
  }

  pointerUp(event) {
    if (!this.reconnecting) {
      super.pointerUp(event)
      this.handles.show(this.selectedEdgeId)
      return
    }
    const reconnecting = this.reconnecting
    this.reconnecting = null
    this.graph.view.hideTempLine()
    this.root.releasePointerCapture(event.pointerId)
    const point = this.getPoint(event)
    const snap = this.graph.getNearestPort(point.x, point.y, this.snapRadius)
    if (!snap) {
      this.handles.show(reconnecting.edgeId)
      return
    }
    const edge = this.graph.model.edges.get(reconnecting.edgeId)
    edge[reconnecting.terminal] = { cell: snap.nodeId, port: snap.portId }
    this.graph.model.emit('edge:changed', edge)
  }

  keyDown(event) {
    super.keyDown(event)
    this.handles.show(this.selectedEdgeId)
  }
}
