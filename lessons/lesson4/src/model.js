let nextId = 1

function makeId(prefix) {
  const id = `${prefix}-${nextId}`
  nextId += 1
  return id
}

export class Node {
  constructor(options = {}) {
    this.id = options.id || makeId('node')
    this.x = options.x || 0
    this.y = options.y || 0
    this.width = options.width || 100
    this.height = options.height || 50
    this.label = options.label || this.id
    this.ports = options.ports || []
  }
}

export class Edge {
  constructor(options = {}) {
    this.id = options.id || makeId('edge')
    this.source = options.source
    this.target = options.target
  }
}

export class Model {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.listeners = new Map()
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(handler)
  }

  emit(event, value) {
    for (const handler of this.listeners.get(event) || []) {
      handler(value)
    }
  }

  addNode(options) {
    const node = new Node(options)
    this.nodes.set(node.id, node)
    this.emit('node:added', node)
    return node
  }

  addEdge(options) {
    const edge = new Edge(options)
    this.edges.set(edge.id, edge)
    this.emit('edge:added', edge)
    return edge
  }

  getNode(id) {
    return this.nodes.get(id) || null
  }

  getNodeAt(x, y) {
    return [...this.nodes.values()].reverse().find((node) => (
      x >= node.x && x <= node.x + node.width
      && y >= node.y && y <= node.y + node.height
    )) || null
  }

  getConnectedEdges(nodeId) {
    return [...this.edges.values()].filter(
      (edge) => edge.source.cell === nodeId || edge.target.cell === nodeId,
    )
  }

  getPortPoint(nodeId, portId) {
    const node = this.getNode(nodeId)
    const port = node?.ports.find((item) => item.id === portId)
    if (!port) {
      return null
    }
    return {
      x: node.x + node.width * port.x,
      y: node.y + node.height * port.y,
      direction: port.direction,
    }
  }

  getTerminalPoint(terminal) {
    if (terminal.port) {
      return this.getPortPoint(terminal.cell, terminal.port)
    }
    if (terminal.cell) {
      const node = this.getNode(terminal.cell)
      return {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      }
    }
    return { x: terminal.x, y: terminal.y }
  }

  getNearestPort(x, y, radius = 12, exclude = null) {
    let best = null
    for (const node of this.nodes.values()) {
      for (const port of node.ports) {
        if (exclude && exclude.nodeId === node.id && exclude.portId === port.id) {
          continue
        }
        const point = this.getPortPoint(node.id, port.id)
        const distance = Math.hypot(point.x - x, point.y - y)
        if (distance <= radius && (!best || distance < best.distance)) {
          best = { nodeId: node.id, portId: port.id, x: point.x, y: point.y, distance }
        }
      }
    }
    return best
  }

  getPortAt(x, y, radius = 8) {
    const found = this.getNearestPort(x, y, radius)
    return found ? { nodeId: found.nodeId, portId: found.portId } : null
  }

  moveNode(id, x, y) {
    const node = this.getNode(id)
    if (!node) {
      return null
    }
    node.x = x
    node.y = y
    this.emit('node:moved', node)
    for (const edge of this.getConnectedEdges(id)) {
      this.emit('edge:changed', edge)
    }
    return node
  }

  removeNode(id) {
    const node = this.getNode(id)
    if (!node) {
      return null
    }
    for (const edge of this.getConnectedEdges(id)) {
      this.edges.delete(edge.id)
      this.emit('edge:removed', edge)
    }
    this.nodes.delete(id)
    this.emit('node:removed', node)
    return node
  }
}
