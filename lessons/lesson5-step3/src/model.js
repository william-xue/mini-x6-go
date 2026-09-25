import { Edge, Model as Step1Model } from '../../lesson5-step1/src/model.js'

function distanceToSegment(x, y, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(x - start.x, y - start.y)
  const projection = ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared
  const t = Math.max(0, Math.min(1, projection))
  return Math.hypot(x - (start.x + t * dx), y - (start.y + t * dy))
}

export class Model extends Step1Model {
  addEdge(options) {
    const edge = new Edge(options)
    edge.vertices = options.vertices || []
    this.edges.set(edge.id, edge)
    this.emit('edge:added', edge)
    return edge
  }

  getEdgeAt(x, y, tolerance = 8) {
    return [...this.edges.values()].reverse().find((edge) => {
      const points = [
        this.getTerminalPoint(edge.source),
        ...edge.vertices,
        this.getTerminalPoint(edge.target),
      ]
      return points.slice(0, -1).some((point, index) => (
        distanceToSegment(x, y, point, points[index + 1]) <= tolerance
      ))
    }) || null
  }
}

export { Node, Edge } from '../../lesson5-step1/src/model.js'
