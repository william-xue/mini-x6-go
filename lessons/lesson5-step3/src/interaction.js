import { Interaction as Step2Interaction } from '../../lesson5-step2/src/interaction.js'
import { VertexHandles } from './vertex-handles.js'

export class Interaction extends Step2Interaction {
  constructor(graph, options = {}) {
    super(graph, options)
    this.vertexHandles = new VertexHandles(graph)
    this.vertexDragging = null
  }

  enable() {
    this.graph.model.on('edge:changed', (edge) => {
      if (edge.id === this.selectedEdgeId) this.vertexHandles.show(edge.id)
    })
    this.graph.model.on('edge:removed', (edge) => {
      if (edge.id === this.vertexHandles.edgeId) this.vertexHandles.show(null)
    })
    return super.enable()
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const vertex = this.vertexHandles.hit(point.x, point.y)
    if (vertex) {
      this.vertexDragging = { edgeId: vertex.edge.id, index: vertex.index }
      this.root.setPointerCapture(event.pointerId)
      return
    }
    super.pointerDown(event)
    this.vertexHandles.show(this.selectedEdgeId)
  }

  pointerMove(event) {
    if (!this.vertexDragging) {
      super.pointerMove(event)
      return
    }
    const point = this.getPoint(event)
    const edge = this.graph.model.edges.get(this.vertexDragging.edgeId)
    edge.vertices[this.vertexDragging.index] = point
    this.graph.model.emit('edge:changed', edge)
  }

  pointerUp(event) {
    if (!this.vertexDragging) {
      super.pointerUp(event)
      this.vertexHandles.show(this.selectedEdgeId)
      return
    }
    this.vertexDragging = null
    this.root.releasePointerCapture(event.pointerId)
  }

  keyDown(event) {
    super.keyDown(event)
    this.vertexHandles.show(this.selectedEdgeId)
  }
}
