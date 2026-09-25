import { Model as Step3Model } from '../../lesson5-step3/src/model.js'
import { routeOrthogonal } from './routing.js'

function distanceToSegment(x, y, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(x - start.x, y - start.y)
  const projection = ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared
  const t = Math.max(0, Math.min(1, projection))
  return Math.hypot(x - (start.x + t * dx), y - (start.y + t * dy))
}

export class Model extends Step3Model {
  getEdgePoints(edge) {
    const source = this.getTerminalPoint(edge.source)
    const target = this.getTerminalPoint(edge.target)
    return edge.vertices.length ? [source, ...edge.vertices, target] : routeOrthogonal(source, target)
  }

  getEdgeAt(x, y, tolerance = 8) {
    return [...this.edges.values()].reverse().find((edge) => {
      const points = this.getEdgePoints(edge)
      return points.slice(0, -1).some((point, index) => (
        distanceToSegment(x, y, point, points[index + 1]) <= tolerance
      ))
    }) || null
  }
}

export { Node, Edge } from '../../lesson5-step3/src/model.js'
