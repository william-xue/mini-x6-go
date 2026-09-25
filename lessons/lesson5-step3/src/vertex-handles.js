const SVG_NS = 'http://www.w3.org/2000/svg'

export class VertexHandles {
  constructor(graph) {
    this.graph = graph
    this.edgeId = null
    this.layer = document.createElementNS(SVG_NS, 'g')
    this.layer.setAttribute('data-vertex-handles', '')
    graph.view.root.appendChild(this.layer)
  }

  show(edgeId) {
    this.layer.replaceChildren()
    this.edgeId = edgeId
    const edge = this.graph.model.edges.get(edgeId)
    if (!edge) return
    edge.vertices.forEach((vertex, index) => {
      const handle = document.createElementNS(SVG_NS, 'circle')
      handle.setAttribute('cx', vertex.x)
      handle.setAttribute('cy', vertex.y)
      handle.setAttribute('r', 7)
      handle.setAttribute('fill', '#ffffff')
      handle.setAttribute('stroke', '#8b5cf6')
      handle.setAttribute('stroke-width', 3)
      handle.setAttribute('data-vertex-index', index)
      this.layer.appendChild(handle)
    })
  }

  hit(x, y, radius = 10) {
    const edge = this.graph.model.edges.get(this.edgeId)
    if (!edge) return null
    const index = edge.vertices.findIndex((vertex) => Math.hypot(vertex.x - x, vertex.y - y) <= radius)
    return index < 0 ? null : { edge, index }
  }
}
