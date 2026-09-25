import { AssemblyModel as BaseModel } from '../../lesson8-step2/src/model.js'
import { getPortPoint } from '../../lesson8-step2/src/instance.js'

let nextEdgeId = 1

export class AssemblyModel extends BaseModel {
  constructor() {
    super()
    this.edges = new Map()
  }

  addEdge({ id, source, target }) {
    const edge = { id: id || `edge-${nextEdgeId++}`, source, target }
    this.edges.set(edge.id, edge)
    this.emit('edge:added', edge)
    return edge
  }

  getConnectedEdges(instanceId) {
    return [...this.edges.values()].filter((edge) => (
      edge.source.instanceId === instanceId || edge.target.instanceId === instanceId
    ))
  }

  getTerminalPoint(terminal) {
    if (terminal.instanceId) {
      return getPortPoint(this.instances.get(terminal.instanceId), terminal.portId)
    }
    return { x: terminal.x, y: terminal.y }
  }

  getNearestPort(x, y, radius = 12, exclude = null) {
    let best = null
    for (const instance of this.instances.values()) {
      for (const port of instance.ports) {
        if (exclude && exclude.instanceId === instance.id && exclude.portId === port.id) continue
        const point = getPortPoint(instance, port.id)
        const distance = Math.hypot(point.x - x, point.y - y)
        if (distance <= radius && (!best || distance < best.distance)) {
          best = {
            instanceId: instance.id,
            portId: port.id,
            x: point.x,
            y: point.y,
            direction: port.direction,
            distance,
          }
        }
      }
    }
    return best
  }

  getPortAt(x, y, radius = 10) {
    return this.getNearestPort(x, y, radius)
  }

  moveInstance(id, x, y) {
    const instance = super.moveInstance(id, x, y)
    if (!instance) return null
    for (const edge of this.getConnectedEdges(id)) this.emit('edge:changed', edge)
    return instance
  }
}
