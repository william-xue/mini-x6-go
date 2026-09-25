const SVG_NS = 'http://www.w3.org/2000/svg'

function circle(attrs) {
  const element = document.createElementNS(SVG_NS, 'circle')
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

export class EdgeHandles {
  constructor(graph) {
    this.graph = graph
    this.layer = document.createElementNS(SVG_NS, 'g')
    this.layer.setAttribute('data-edge-handles', '')
    graph.view.root.appendChild(this.layer)
    this.edgeId = null
  }

  show(edgeId) {
    this.layer.replaceChildren()
    this.edgeId = edgeId
    if (!edgeId) return
    const edge = this.graph.model.edges.get(edgeId)
    if (!edge) return
    for (const terminal of ['source', 'target']) {
      const point = this.graph.model.getTerminalPoint(edge[terminal])
      this.layer.appendChild(circle({
        cx: point.x,
        cy: point.y,
        r: 8,
        fill: '#ffffff',
        stroke: '#f07a28',
        'stroke-width': 3,
        'data-terminal': terminal,
      }))
    }
  }

  hit(x, y, radius = 10) {
    if (!this.edgeId) return null
    const edge = this.graph.model.edges.get(this.edgeId)
    if (!edge) return null
    for (const terminal of ['source', 'target']) {
      const point = this.graph.model.getTerminalPoint(edge[terminal])
      if (Math.hypot(point.x - x, point.y - y) <= radius) {
        return { edge, terminal, point }
      }
    }
    return null
  }
}
